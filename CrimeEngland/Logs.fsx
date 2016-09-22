#I @"..\packages\"
#load @"FSharp.Charting.0.90.14\FSharp.Charting.fsx"

open System.IO
open System
open FSharp.Charting

let path = @"C:\Users\alina.gryaznova\Desktop\logs"
type Log = {Date : DateTime; Method : string; Path : string;  Params : string; Code : string; Duration : int}

let MapToType(row : string[]) =
    try
        Some { Date=DateTime.Parse(row.[0] + " " + row.[1]); Method = row.[3]; Path = row.[4]; Params = row.[5]; Code = row.[11]; Duration = Int32.Parse row.[14]}
    with
        | _ -> None            

let data = 
    Directory.EnumerateFiles path
    |> Seq.map(fun filename -> File.ReadAllLines filename |> Seq.skip 4)   
    |> Seq.map(fun rows -> rows |> Seq.map (fun (r : string) -> r.Split(' ')))
    |> Seq.concat
    |> Seq.map(fun row -> MapToType row)    
    |> Seq.toList
    |> List.choose id
    |> List.filter(fun log -> log.Path.IndexOf("id06") >= 0 && log.Path.IndexOf("swagger") < 0 && log.Path.IndexOf("token") < 0 &&  log.Path.IndexOf(".html") < 0 && log.Path.IndexOf(".js") < 0)       

let maxDuration =
    data
    |> List.maxBy(fun d -> d.Duration)

let requestsCount = data |> Seq.length
let startDate = data |> Seq.minBy(fun log -> log.Date)
let beginning = startDate.Date.Date

let byTime = 
    data
    |> Seq.map(fun log -> log, (int)(log.Date - beginning).TotalSeconds / 3600)
    |> Seq.groupBy(fun (log, period) -> period)    

byTime 
|> Seq.map(fun(period, grp) -> period, Seq.length grp) 
|> Chart.Column 
|> Chart.WithXAxis (LabelStyle = ChartTypes.LabelStyle(Angle = -45, Interval = 10.0)) 
|> Chart.WithTitle "Request counts by time, hours"

let peakRequests =
    byTime
    |> Seq.sortBy(fun(period, grp) -> - Seq.length grp)
    |> Seq.map(fun(period, grp) -> grp|>Seq.minBy(fun (log,_) -> log.Date)|>fst,  grp|>Seq.maxBy(fun (log,_) -> log.Date)|> fst, grp |> Seq.countBy(fun (f,p) -> f.Method + ":" + f.Path) |> Seq.sortBy(fun(path,cnt) -> -cnt) |> Seq.take 2 |> Seq.toList)
    |> Seq.map(fun(mn,mx,lst) -> mn.Date, mx.Date, lst)
    |> Seq.take 10
    |> Seq.sortBy(fun(mn,_,_) -> mn)
    |> Seq.map(fun(mn,mx,lst) -> lst |> Seq.map(fun(path, cnt) -> mn.ToString() + " " + path, cnt))
    |> Seq.concat
    |> Seq.toList

peakRequests|> Chart.Column |> Chart.WithXAxis (LabelStyle = ChartTypes.LabelStyle(Angle = -45, Interval = 1.0))

let peakGrp =
    byTime
    |> Seq.sortBy(fun(period, grp) -> - Seq.length grp)
    |> Seq.take 1
    |> Seq.toList

let peakUnfloded =
    peakGrp
    |> Seq.map(fun(_, grp) -> grp |> Seq.map(fun(l,_) -> l))
    |> Seq.concat
    |> Seq.groupBy(fun l -> l.Method + " " + l.Path)
    |> Seq.sortBy(fun(m, grp) -> grp |>Seq.length)
    |> Seq.last
    |> snd
    |> Seq.filter(fun l -> l.Params.IndexOf("updated") < 0 && l.Path.IndexOf("status") > 0)
    |> Seq.map(fun l -> l.Date, l.Duration)
    
let avgDurationsOnPeak = 
    peakUnfloded
    |> Seq.groupBy(fun(t,d) -> t)
    |> Seq.map(fun(t,g) -> t, g|>Seq.averageBy(fun (t,d) -> (float)(d/1000)))
    |> Seq.toList

let countsOnPeak = 
    peakUnfloded
    |> Seq.groupBy(fun(t,d) -> t)
    |> Seq.map(fun(t,g) -> t, g|>Seq.length)
    |> Seq.toList

Chart.Combine [Chart.Point countsOnPeak; Chart.Line avgDurationsOnPeak ]

let byPath =
    data
    |> Seq.countBy(fun f -> f.Method + ":" + f.Path)
    |> Seq.map(fun (path, count) -> path, count, 100.0*(float)count/(float)requestsCount)
    |> Seq.sortBy(fun (path, count, percent) -> -count)
    |> Seq.toList

let histlog = byPath|> List.map(fun (p,c,t) -> p, Math.Log((float)c))|>List.toArray
let hist = byPath|> List.map(fun (p,c,t) -> p, c)|>List.toArray

histlog |> Chart.Column |> Chart.WithXAxis (LabelStyle = ChartTypes.LabelStyle(Angle = -45, Interval = 1.0)) |> Chart.WithTitle "Request counts by type in log format"