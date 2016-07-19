namespace CEServer

module Data =
    
    open FSharp.Data
    open System.IO

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
        
    let extractPlace(cr:Crime) = cr.Place
    let extractType(cr:Crime) = cr.Type
    let suspectFoud(cr:Crime) = cr.Outcome <> "Investigation complete; no suspect identified"
    let hasOutcome(cr:Crime) = cr.Outcome.Length > 0 && cr.Outcome <> "Under investigation"

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


