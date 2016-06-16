#I @"..\packages\"
#r @"FSharp.Data.2.3.0\lib\net40\FSharp.Data.dll"
#load @"FSharp.Charting.0.90.14\FSharp.Charting.fsx"

open FSharp.Data
open System.IO
open FSharp.Charting

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
