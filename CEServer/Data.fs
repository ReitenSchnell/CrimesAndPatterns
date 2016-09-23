namespace CEServer

module Data =
    
    open FSharp.Data
    open System.IO   
    open Newtonsoft.Json
    open Newtonsoft.Json.Serialization  

    type CrimeReport = CsvProvider<"sample.csv", AssumeMissingValues  = true>
    type CrimeReportRow = CrimeReport.Row
    type Crime = {
        [<JsonProperty(PropertyName = "P")>]
        Place : int; 
        [<JsonProperty(PropertyName = "T")>]
        Type : int; 
        [<JsonProperty(PropertyName = "O")>]
        Outcome : int}
    type Statistics = {Label : string; Value : float; Fraction : string; Percentage : float}
    type Entity = {Label: string; Id : int}
    type Dump = {Crimes : Crime list; Places : Entity list; Types : Entity list}    

    let pathToData = __SOURCE_DIRECTORY__ + @"..\..\Data\Data\"
    
    let extractPlace(cr:Crime) = cr.Place
    let extractType(cr:Crime) = cr.Type
    let filename = __SOURCE_DIRECTORY__ + "\dump.json"

    let mapOutcome value =
            match value with
            | null -> 0
            | "" -> 0
            | "Under investigation" -> 0
            | "Investigation complete; no suspect identified" -> 1
            | _ -> 2

    let prepareData =
        let rawData =
            Directory.EnumerateDirectories pathToData 
            |> Seq.map Directory.EnumerateFiles
            |> Seq.concat
            |> Seq.map(fun filename -> (CrimeReport.Load filename).Rows)
            |> Seq.concat            

        let extractPlaceRow(row : CrimeReportRow) = row.``Reported by``.Replace(" Police", "").Replace(" Constabulary", "")
        let extractTypeRow(row : CrimeReportRow) = row.``Crime type``
        let extractOutcomeRow(row : CrimeReportRow) = row.``Last outcome category``        

        let getPossibleValues extractor (rows : CrimeReportRow seq) =
            let lst =
                rows
                |> Seq.map extractor
                |> Seq.distinct
                |> Seq.toList
                |> List.sort
            lst
            |> List.map(fun e -> {Label = e; Id = List.findIndex (fun a -> a = e) lst})            

        let places = getPossibleValues extractPlaceRow rawData
        let types = getPossibleValues extractTypeRow rawData
        let findIndex (labels : Entity list) value = List.findIndex (fun a -> a.Label = value) labels       
        
        let mapToCrime(row : CrimeReportRow) =
            {Outcome = extractOutcomeRow row |> mapOutcome; Place = extractPlaceRow row |> findIndex places; Type = extractTypeRow row |> findIndex types}

        let crimes = 
            rawData
            |> Seq.map(fun rows -> mapToCrime rows)
            |> Seq.toList
        
        let dump = {Crimes = crimes; Places = places; Types = types}
        let serialized = JsonConvert.SerializeObject(dump)
        File.WriteAllText(filename, serialized)                        

        (places, types, crimes)

    let openData =
        let serialized = File.ReadAllText filename
        let dump = JsonConvert.DeserializeObject<Dump>(serialized)
        (dump.Places, dump.Types, dump.Crimes)

    let findLabelById labels value = (Seq.find(fun v -> v.Id = value) labels).Label 

    let mapListToWrappers (labels:Entity seq) (pairs: (int * int) seq) =
        let getPercentage value sum = System.Math.Round(100.0 * (float) value / sum, 2)
        let overall = pairs |> Seq.sumBy(fun (_, v) -> v) |> (float)         
        pairs
        |> Seq.map(fun(l,v) -> {Label = findLabelById labels l ; Value = (float) v; Fraction = (getPercentage v overall).ToString() + "%"; Percentage = getPercentage v overall})        

    let crimesByCategory (crimes:Crime seq) extractor (labels:Entity seq) =
            crimes                
            |> Seq.countBy extractor
            |> Seq.toList
            |> mapListToWrappers labels            

    let crimesByType (crimes:Crime seq) (labels:Entity seq) = crimesByCategory crimes extractType labels
    let crimesByPlace (crimes:Crime seq) (labels:Entity seq) = crimesByCategory crimes extractPlace labels |> Seq.filter(fun e -> e.Percentage >= 2.5)    

    let calculateStatistics (crimes:Crime seq) (types:Entity list) =
        let getStats (pairs: (int * int) seq) =
            let getPercentage value sum = 100.0 * System.Math.Round((float) value / sum, 2)
            let overall = pairs |> Seq.sumBy(fun (_, v) -> v) |> (float)
            let calculated =
                pairs
                |> Seq.map (fun (l,v) -> l, getPercentage v overall)
                |> dict
            types
            |> List.map(fun e -> if calculated.ContainsKey e.Id then (e.Id, calculated.[e.Id]) else (e.Id, 0.0))                        
            
        let stats =
            crimes
            |> Seq.groupBy extractPlace
            |> Seq.map(fun (l, vs) -> (l, Seq.countBy extractType vs))
            |> Seq.map(fun (l, pairs) -> (l, getStats pairs))
            |> Seq.map(fun (l, values) -> (l, Seq.toArray values))
            |> Seq.toArray
        stats

    let calculateSuspectFoundStatistics (crimes:Crime seq) =
        let suspectFoundData = 
            crimes
            |> Seq.filter(fun cr -> cr.Outcome > 1)
        calculateStatistics suspectFoundData