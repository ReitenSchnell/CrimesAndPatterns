namespace CEServer

module Data =
    
    open FSharp.Data
    open System.IO
    open Accord.MachineLearning.DecisionTrees   

    type CrimeReport = CsvProvider<"sample.csv", AssumeMissingValues  = true>
    type CrimeReportRow = CrimeReport.Row
    type Crime = {Place : string; Type : string; Outcome : string}
    type Statistics = {Label : string; Value : float; Fraction : float}    

    let pathToData = __SOURCE_DIRECTORY__ + @"..\..\Data\CrimeEngland1\"

    let mapToCrime(cr : CrimeReportRow seq) = 
        cr
        |> Seq.map(fun(row : CrimeReportRow) -> {Place = row.``Reported by``; Outcome = row.``Last outcome category``; Type = row.``Crime type`` })

    let prepareData = 
        Directory.EnumerateDirectories pathToData 
        |> Seq.map Directory.EnumerateFiles
        |> Seq.concat
        |> Seq.map(fun filename -> (CrimeReport.Load filename).Rows)   
        |> Seq.map(fun rows -> mapToCrime rows)
        |> Seq.concat
        |> Seq.toList

    let getPossibleValues extractor (crimes : Crime list) =
        crimes
        |> Seq.map extractor
        |> Seq.distinct
        |> Seq.toList
        |> List.sort
        
    let getRate extractor (crimes:Crime seq) =
        let total = crimes |> Seq.length
        let foundCrimes = 
            crimes
            |> Seq.filter extractor
            |> Seq.length
        100.0 * (float foundCrimes/float total)

    let getGroupedData extractor (crimes:Crime seq) =
        crimes
        |> Seq.groupBy extractor 

    let mapListToWrappers (pairs: (string * int) seq) =
        let overall = pairs |> Seq.sumBy(fun (_, v) -> v) |> (float)
        pairs
        |> Seq.map(fun(l,v) -> {Label = l; Value = (float) v; Fraction = System.Math.Round(100.0 * (float) v / overall, 2)})        

    let extractPlace(cr:Crime) = cr.Place
    let extractType(cr:Crime) = cr.Type   
    
    let crimesByPlace (crimes:Crime seq) =
        crimes                
        |> Seq.countBy extractPlace
        |> Seq.toList
        |> mapListToWrappers

    let crimesByType (crimes:Crime seq) =
        crimes                
        |> Seq.countBy extractType
        |> Seq.toList
        |> mapListToWrappers

    let learn data =
        let suspectFoud(cr:Crime) = cr.Outcome <> "Investigation complete; no suspect identified"
        let hasOutcome = data |> List.filter(fun (cr : Crime) -> cr.Outcome.Length > 0 && cr.Outcome <> "Under investigation")    

        let featureValues(extractor) (crimes:Crime seq) =
            crimes 
            |> Seq.map(fun (cr:Crime) -> extractor cr) 
            |> Seq.distinct

        let places = hasOutcome |> featureValues extractPlace |> Seq.toList
        let crimeTypes = hasOutcome |> featureValues extractType |> Seq.toList
    
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
                [|extractPlace cr |> encodeCategory places; extractType cr |> encodeCategory crimeTypes |])
            |> Seq.toArray

        let encodeOutputs(crimes:Crime seq) =
            crimes
            |> Seq.map(fun(cr:Crime) -> suspectFoud cr |> System.Convert.ToInt32)
            |> Seq.toArray

        let run = learning.Run(training|>encodeInputs, training|>encodeOutputs)
        let validationAccuracy = 1.0 - learning.ComputeError(validation|>encodeInputs, validation|>encodeOutputs)
        let trainingAccuracy = 1.0 - learning.ComputeError(training|>encodeInputs, training|>encodeOutputs)
        (trainingAccuracy, validationAccuracy)


