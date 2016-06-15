#I @"..\packages\"
#r @"FSharp.Data.2.3.0\lib\net40\FSharp.Data.dll"
#load @"FSharp.Charting.0.90.14\FSharp.Charting.fsx"

open FSharp.Data
open System.IO
open FSharp.Charting

type CrimeReport = CsvProvider<"sample.csv", AssumeMissingValues  = true>
type CrimeReport.Row with
    member this.Place = ""
type Crime = CrimeReport.Row

let path = __SOURCE_DIRECTORY__ + @"..\..\Data\CrimeEngland\"

let data = 
    Directory.EnumerateDirectories path 
    |> Seq.map Directory.EnumerateFiles
    |> Seq.concat
    |> Seq.map(fun filename -> (CrimeReport.Load filename).Rows)
    |> Seq.concat    
    |> Seq.toList

let overall = data.Length
let hasOutcome = data |> List.filter(fun (cr : Crime) -> cr.``Last outcome category``.Length > 0 && cr.``Last outcome category`` <> "Under investigation")
let outcomePercent = 100.0*(float)hasOutcome.Length/(float)overall

let groupData featureExtractor = 
    hasOutcome
    |> Seq.groupBy(featureExtractor)
    |> Seq.map (fun (label, group) -> label, group |> Seq.length)
    |> Seq.toList

let extractOutcome(cr:Crime) = cr.``Last outcome category``
let extractCrimeType(cr:Crime) = cr.``Crime type``
let suspectFoud(cr:Crime) = cr.``Last outcome category`` <> "Investigation complete; no suspect identified"

let chancesToSolve = hasOutcome|> Seq.averageBy(fun (cr : Crime) -> if cr.``Last outcome category`` = "Investigation complete; no suspect identified" then 0.0 else 1.0)   
groupData extractOutcome |> Chart.Pie
