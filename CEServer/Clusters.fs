namespace CEServer
open CEServer.Data

module Clusters =
    type Stat = {Type : string; Percent : string}
    type Similars = {Place : string; Cluster : int; Stats : Stat[]}
    
    let pickFrom size k =
        let rng = System.Random()
        printfn "start picking for %A and %A" k size
        let rec pick (set:int Set) =
            let candidate = rng.Next(size)            
            let set = set.Add candidate
            if set.Count = k then set
            else pick set
        pick Set.empty |> Set.toArray

    let initialize observations k =
        let size = Array.length observations
        let centroids = 
            pickFrom size k
            |> Array.mapi (fun i index -> i+1, observations.[index])
        let assignments = 
            observations
            |> Array.map (fun x -> 0, x)
        (assignments, centroids)

    let clusterize distance centroidOf observations k =
        let rec search (assignments, centroids) = 
            printfn "Iteration start"
            let classifier observation =
                centroids
                |> Array.minBy(fun (_, centroid) -> distance observation centroid)
                |> fst

            printfn "New assignments"
            let assignments' =
                assignments
                |> Array.map(fun (_, observation) -> 
                    let closestCentroidId = classifier observation
                    (closestCentroidId, observation))

            printfn "Changes"
            let changed = 
                (assignments, assignments')
                ||> Seq.zip
                |> Seq.exists(fun ((oldClusterId, _), (newClusterId, _)) -> not (oldClusterId = newClusterId))
            
            if changed
            then 
                let centroids' = 
                    assignments'
                    |> Seq.groupBy fst
                    |> Seq.map(fun (clusterId, group) -> 
                        clusterId, group|>Seq.map snd|> centroidOf)
                    |> Seq.toArray
                search(assignments', centroids')
            else centroids, classifier

        printfn "initialization"
        let initialValues = initialize observations k
        printfn "initialized"
        search initialValues

    let squareError (obs1:double[])(obs2:double[]) =
        (obs1, obs2)
        ||> Seq.zip
        |> Seq.sumBy(fun (x1,x2) -> (x1-x2)*(x1-x2))

    let RSS (dataset:double[][]) centroids =
        dataset
        |> Seq.sumBy(fun obs ->
            centroids
            |> Seq.map (squareError obs)
            |> Seq.min)

    let AIC (dataset:double[][]) centroids =
        let k = centroids |> Seq.length
        let m = dataset.[0] |> Seq.length
        RSS dataset centroids + float(2*m*k)

    let centroidOf (features : int) (cluster: double[] seq) =
        Array.init features (fun f ->
            cluster
            |> Seq.averageBy (fun obs -> obs.[f]))

    let distance(obs1:double[])(obs2:double[]) =
        (obs1, obs2)
        ||> Seq.map2(fun u1 u2 -> (u1-u2)*(u1-u2))
        |> Seq.sum

    let getClusters (observations : (int*(int*float)[])[]) (places : Entity list) (types:Entity list) =        
        let featuresCount = Array.length observations        
        let data = 
            observations
            |> Array.map(fun(_, arr) -> Array.map(fun (_,a) -> a) arr)
        let ruleOfThumb = sqrt(float featuresCount/2.0) |> (int)
        printfn "Starting clusters %A %A" ruleOfThumb featuresCount
        let minBound = if ruleOfThumb - 2 >= 2 then ruleOfThumb - 2 else ruleOfThumb
        let maxBound = if ruleOfThumb + 2 <= featuresCount - 1 then ruleOfThumb + 2 else ruleOfThumb
        let possibleKs = 
            [minBound .. maxBound]
            |> Seq.map(fun k ->
                let value = 
                    [for _ in 1..1 ->
                        let (clusters,classifier) =
                            let features = Array.length data.[0]
                            printfn "Clustering first stage"
                            let clustering = clusterize distance (centroidOf features)
                            clustering data k                    
                        AIC data (clusters |> Seq.map snd) ]
                    |> List.average
                k, value)        
        let (k, err) = 
            possibleKs
            |> Seq.minBy(fun (k,err) -> err)
        let (bestClusters, bestClassifier) =
            let features = Array.length data.[0]
            let clustering = clusterize distance (centroidOf features)            
            seq {
                for _ in 1..10 ->
                    printfn "Clustering second stage"
                    clustering data k
            }
            |> Seq.minBy (fun(cs, f) -> RSS data (cs |> Seq.map snd))
        let getTop (stats : (int*float)[]) =
            stats
            |> Array.sortBy(fun (l,v) -> -1.0*v)
            |> Seq.take 5
            |> Seq.map(fun(l,v) -> findLabelById types l, v)
            |> Seq.map(fun(t,p) -> {Type = t; Percent = System.Math.Round(p,0).ToString() + "%"})
            |> Seq.toArray
        let clusters =
            observations            
            |> Array.map(fun (ind, v) -> findLabelById places ind, v |> Array.map(fun (l,a) -> a) |> bestClassifier, v)
            |> Array.map(fun (place, cluster, stats) -> {Place = place; Cluster = cluster; Stats = getTop stats})            
        clusters
        

