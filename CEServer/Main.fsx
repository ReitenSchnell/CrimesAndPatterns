#I @"..\packages\"
#r @"Suave.1.1.3\lib\net40\Suave.dll"
#r @"Newtonsoft.Json.8.0.3\lib\net40\Newtonsoft.Json.dll"
#r @"FSharp.Data.2.3.0\lib\net40\FSharp.Data.dll"
#load "Web.fs"
#load "Data.fs"
#load "Clusters.fs"
#load "Tree.fs"

open Suave
open Suave.Filters
open Suave.Successful
open Suave.Operators
open System
open Suave.Json
open Suave.Files
open CEServer.Web
open CEServer.Data
open CEServer.Clusters
open Suave.Redirection
open Suave.Writers
open System.Web
open System.Threading
open CEServer.Tree

printfn "reading data"
let places, crimeTypes, crimes = openData
printfn "calculating stats"
let stats = calculateStatistics crimes crimeTypes
printfn "calculating found stats"
let foundStats = calculateSuspectFoundStatistics crimes crimeTypes
printfn "clusters"
printfn "%A" stats   
let similarPlaces = getClusters stats places crimeTypes
let similarPlacesWithSuspect = getClusters foundStats places crimeTypes
printfn "by type and place"
let byPlace = crimesByPlace crimes places
let byType = crimesByType crimes crimeTypes
printfn "growing tree"
let mtree = manualTree crimes
let mprediction = manualpredict mtree places

let app =
    choose
        [ 
            GET >=> choose[
                      path "/" >=> redirect "/index.html"
                      path "/index.html" >=> file "index.html"; browseHome
                      path "/app.js" >=> file "app.js"; browseHome
                      path "/app.css" >=> file "app.css"; browseHome
                      path "/lib.css" >=> file "lib.css"; browseHome
                      path "/lib.js" >=> file "lib.js"; browseHome
                      path "/template.js" >=> file "template.js"; browseHome
                      path "/tregions.json" >=> file "tregions.json"; browseHome
                      path "/uk.json" >=> file "uk.json"; browseHome
                      path "/api/places" >=> json places
                      path "/api/crimes/byplace" >=> json byPlace
                      path "/api/crimes/bytype" >=> json byType
                      path "/api/types" >=> json crimeTypes              
                      path "/api/similar/general" >=> json similarPlaces              
                      path "/api/similar/found" >=> json similarPlacesWithSuspect              
                      pathScan "/api/predict/%s" (fun (a:string) -> json (mprediction a))]         
        ]
    

startWebServer { defaultConfig with homeFolder = Some __SOURCE_DIRECTORY__ } app
        
