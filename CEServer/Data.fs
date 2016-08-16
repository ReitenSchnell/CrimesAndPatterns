namespace CEServer

module Data =
    
    open FSharp.Data
    open System.IO
    open Accord.MachineLearning.DecisionTrees
    open Accord.Statistics.Distributions.DensityKernels
    open Accord.MachineLearning

    type CrimeReport = CsvProvider<"sample.csv", AssumeMissingValues  = true>
    type CrimeReportRow = CrimeReport.Row
    type Crime = {Place : int; Type : int; Outcome : string}
    type Statistics = {Label : string; Value : float; Fraction : string}
    type Entity = {Label: string; Id : int}    

    let pathToData = __SOURCE_DIRECTORY__ + @"..\..\Data\CrimeEngland1\"
    
    let extractPlace(cr:Crime) = cr.Place
    let extractType(cr:Crime) = cr.Type

    let prepareData =
        let rawData =
            Directory.EnumerateDirectories pathToData 
            |> Seq.map Directory.EnumerateFiles
            |> Seq.concat
            |> Seq.map(fun filename -> (CrimeReport.Load filename).Rows)
            |> Seq.concat
            |> Seq.toList

        let extractPlaceRow(row : CrimeReportRow) = row.``Reported by``.Replace(" Police", "")
        let extractTypeRow(row : CrimeReportRow) = row.``Crime type``
        let extractOutcomeRow(row : CrimeReportRow) = row.``Last outcome category``

        let getPossibleValues extractor (rows : CrimeReportRow list) =
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
            {Outcome = extractOutcomeRow row; Place = extractPlaceRow row |> findIndex places; Type = extractTypeRow row |> findIndex types}

        let crimes = 
            rawData
            |> Seq.map(fun rows -> mapToCrime rows)
            |> Seq.toList

        (places, types, crimes)

    let findLabelById labels value = (Seq.find(fun v -> v.Id = value) labels).Label 

    let mapListToWrappers (labels:Entity seq) (pairs: (int * int) seq) =
        let getPercentage value sum = System.Math.Round(100.0 * (float) value / sum, 2).ToString() + "%"
        let overall = pairs |> Seq.sumBy(fun (_, v) -> v) |> (float)         
        pairs
        |> Seq.map(fun(l,v) -> {Label = findLabelById labels l ; Value = (float) v; Fraction = getPercentage v overall})        

    let crimesByCategory (crimes:Crime seq) extractor (labels:Entity seq) =
            crimes                
            |> Seq.countBy extractor
            |> Seq.toList
            |> mapListToWrappers labels

    let crimesByType (crimes:Crime seq) (labels:Entity seq) = crimesByCategory crimes extractType labels
    let crimesByPlace (crimes:Crime seq) (labels:Entity seq) = crimesByCategory crimes extractPlace labels

    let learn data places crimeTypes =
        let suspectFoud(cr:Crime) = cr.Outcome <> "Investigation complete; no suspect identified"
        let hasOutcome = data |> List.filter(fun (cr : Crime) -> cr.Outcome.Length > 0 && cr.Outcome <> "Under investigation")    

        let classCount = 2
        let attributes = [|new DecisionVariable("Place", places|>Seq.length); new DecisionVariable("Type", crimeTypes|>Seq.length)|];
        let tree = new DecisionTree(attributes, classCount)
        let learning = new Learning.ID3Learning(tree)

        let columnNames = [|"Place"; "Type"; "SuspectFound"|]       

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
                [|extractPlace cr; extractType cr|])
            |> Seq.toArray

        let encodeOutputs(crimes:Crime seq) =
            crimes
            |> Seq.map(fun(cr:Crime) -> suspectFoud cr |> System.Convert.ToInt32)
            |> Seq.toArray

        let inputs =  training|>encodeOutputs
        printfn "%A" inputs
        let run = learning.Run(training |> encodeInputs, training |> encodeOutputs)
        let validationAccuracy = 1.0 - learning.ComputeError(validation|>encodeInputs, validation|>encodeOutputs)
        let trainingAccuracy = 1.0 - learning.ComputeError(training|>encodeInputs, training|>encodeOutputs)
        tree

    let predict (tree : DecisionTree) (places : Entity list) crimeType =
        places
        |> Seq.map(fun place -> (place.Label, tree.Compute([|place.Id; System.Int32.Parse crimeType|])))
        |> Seq.toList

    let calculateStatistics (crimes:Crime seq) =
        let getStats (pairs: (int * int) seq) =
            let getPercentage value sum = 100.0 * System.Math.Round((float) value / sum, 2)
            let overall = pairs |> Seq.sumBy(fun (_, v) -> v) |> (float)
            pairs
            |> Seq.map (fun (_,v) -> getPercentage v overall)  
        crimes
        |> Seq.groupBy extractPlace
        |> Seq.map(fun (l, vs) -> Seq.countBy extractType vs)
        |> Seq.map(fun pairs -> getStats pairs)
        |> Seq.map(fun values -> Seq.toArray values)
        |> Seq.toArray

    
        


        
        


