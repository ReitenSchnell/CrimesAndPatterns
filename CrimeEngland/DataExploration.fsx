#I @"..\packages\"
#r @"FSharp.Data.2.3.0\lib\net40\FSharp.Data.dll"
#load @"FSharp.Charting.0.90.14\FSharp.Charting.fsx"
#r @"Accord.3.0.2\lib\net45\Accord.dll"
#r @"Accord.MachineLearning.3.0.2\lib\net45\Accord.MachineLearning.dll"
#r @"Accord.Statistics.3.0.2\lib\net45\Accord.Statistics.dll"
#r @"Accord.Math.3.0.2\lib\net45\Accord.Math.dll"
#load "Tree.fs"

open FSharp.Data
open System.IO
open FSharp.Charting
open Accord.MachineLearning.DecisionTrees
open Accord
open Accord.Statistics.Filters
open Accord.Math
open CrimeEngland.Tree


type CrimeReport = CsvProvider<"sample.csv", AssumeMissingValues  = true>
type CrimeReportRow = CrimeReport.Row
type Crime = {Place : string; Type : string; Outcome : string}

let path = __SOURCE_DIRECTORY__ + @"..\..\Data\CrimeEngland\"

let mapToCrime(cr : CrimeReportRow seq) = 
    cr
    |> Seq.map(fun(row : CrimeReportRow) -> {Place = row.``Reported by``; Outcome = row.``Last outcome category``; Type = row.``Crime type`` })

let data = 
    Directory.EnumerateDirectories path 
    |> Seq.map Directory.EnumerateFiles
    |> Seq.concat
    |> Seq.map(fun filename -> (CrimeReport.Load filename).Rows)   
    |> Seq.map(fun rows -> mapToCrime rows)
    |> Seq.concat
    |> Seq.toList   

let overall = data.Length
let hasOutcome = data |> List.filter(fun (cr : Crime) -> cr.Outcome.Length > 0 && cr.Outcome <> "Under investigation")
let outcomePercent = 100.0*(float)hasOutcome.Length/(float)overall

let groupData featureExtractor = 
    hasOutcome
    |> Seq.groupBy(featureExtractor)
    |> Seq.map (fun (label, group) -> label, group |> Seq.length)
    |> Seq.toList

let extractOutcome(cr:Crime) = cr.Outcome
let extractCrimeType(cr:Crime) = cr.Type
let extractPlace(cr:Crime) = cr.Place
let suspectFoud(cr:Crime) = cr.Outcome <> "Investigation complete; no suspect identified"

let chancesToSolve = hasOutcome|> Seq.averageBy(fun (cr : Crime) -> if cr.Outcome = "Investigation complete; no suspect identified" then 0.0 else 1.0)   
groupData extractPlace |> Chart.Pie

let suspectFoundRate (crimes:Crime seq) =
    let total = crimes |> Seq.length
    let foundSuspects = 
        crimes
        |> Seq.filter(fun p -> suspectFoud p)
        |> Seq.length
    100.0 * (float foundSuspects/float total)

let byPlace =
    hasOutcome
    |> Seq.groupBy(fun p -> extractPlace p)

let byCrimeType =
    hasOutcome
    |> Seq.groupBy(fun p -> extractCrimeType p)

byPlace |> Seq.map(fun (s,g) -> s, (suspectFoundRate g)) |> Seq.toList
byCrimeType |> Seq.map(fun (s,g) -> s, (suspectFoundRate g)) |> Seq.toList

let entropy extract data =
    let size = data |> Seq.length
    data
    |> Seq.map (fun obs -> extract obs)
    |> Seq.countBy id
    |> Seq.map (fun (_, count) -> float count/float size)
    |> Seq.sumBy (fun f -> if f > 0. then -f*log f else 0.)

let splitEntropy extractLabel extractFeature data =
    let size = data |> Seq.length
    data
    |> Seq.groupBy(extractFeature)
    |> Seq.sumBy(fun (_, group) ->
        let groupSize = group|> Seq.length
        let probaGroup = float groupSize / float size
        let groupEntropy = group |> entropy extractLabel
        probaGroup * groupEntropy)

let h = hasOutcome |> entropy suspectFoud
hasOutcome |> splitEntropy suspectFoud extractCrimeType |> printfn "By Crime: %3f"
hasOutcome |> splitEntropy suspectFoud extractPlace |> printfn "By Place: %3f"

let featureValues(extractor) (crimes:Crime seq) =
    crimes 
    |> Seq.map(fun (cr:Crime) -> extractor cr) 
    |> Seq.distinct  

let places = hasOutcome |> featureValues extractPlace |> Seq.toList
let crimeTypes = hasOutcome |> featureValues extractCrimeType |> Seq.toList

let classCount = 2
let attributes = [|new DecisionVariable("Place", places|>Seq.length); new DecisionVariable("Type", crimeTypes|>Seq.length)|];
let tree = new DecisionTree(attributes, classCount)
let learning = new Learning.ID3Learning(tree)

let columnNames = [|"Place"; "Type"; "SuspectFound"|]

let encodeCategory (possibleValues:string seq) (value:string) =
    possibleValues
    |> Seq.findIndex(fun str -> str = value)

let seed = 314159
let rng = System.Random(seed)

let shuffle(arr:'a[]) =
    let arr = Array.copy arr
    let l = arr.Length
    for i in (l-1) .. -1 .. 1 do
        let temp = arr.[i]
        let j = rng.Next(0, i+1)
        arr.[j] <- arr.[i]
        arr.[i] <- temp
    arr

let training, validation =
    let shuffled = 
        hasOutcome
        |>Seq.toArray
        |>shuffle
    let size = 0.7*float(Array.length shuffled) |> int
    shuffled.[..size], shuffled.[size+1..]

let encodeInputs(crimes:Crime seq) =
    crimes
    |> Seq.map(fun(cr:Crime) -> 
        [|extractPlace cr |> encodeCategory places; extractCrimeType cr |> encodeCategory crimeTypes |])
    |> Seq.toArray

let encodeOutputs(crimes:Crime seq) =
    crimes
    |> Seq.map(fun(cr:Crime) -> suspectFoud cr |> System.Convert.ToInt32)
    |> Seq.toArray

learning.Run(training|>encodeInputs, training|>encodeOutputs)

let manualAccuracy = 
    let inputs = encodeInputs validation
    let outputs = encodeOutputs validation
    Array.zip inputs outputs
    |> Array.averageBy(fun (i,o) -> if tree.Compute i = o then 1.0 else 0.0)    

let validationAccuracy = 1.0 - learning.ComputeError(validation|>encodeInputs, validation|>encodeOutputs)
let trainingAccuracy = 1.0 - learning.ComputeError(training|>encodeInputs, training|>encodeOutputs)

let filters = [entropyGainFilter; leafSizeFilter 10]
let features = [
    "Place", fun(cr:Crime) -> cr.Place |> Some
    "Type", fun(cr:Crime) -> cr.Type |> Some
    ]

let accuracy tree (sample : Crime seq) =
    sample
    |> Seq.averageBy(fun p ->
        if suspectFoud p = decide tree p then 1.0 else 0.0)

let manualTree = growTree filters hasOutcome suspectFoud (features |> Map.ofList)

let manualTreeAccuracy = hasOutcome |> accuracy manualTree

let valLen = validation.Length
let trainLen = training.Length
