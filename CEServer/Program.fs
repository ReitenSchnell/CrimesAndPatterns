namespace CEServer

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

module IISHelpers =
    open System

    let httpPlatformPort =
        match Environment.GetEnvironmentVariable("HTTP_PLATFORM_PORT") with
        | null -> None
        | value ->
            match Int32.TryParse(value) with
            | true, value -> Some value
            | false, _ -> None

module Program =

    [<EntryPoint>]
    let main argv = 

        let places, crimeTypes, crimes = openData
        let stats = calculateStatistics crimes crimeTypes
        let foundStats = calculateSuspectFoundStatistics crimes crimeTypes   
        let similarPlaces = getClusters stats places crimeTypes
        let similarPlacesWithSuspect = getClusters foundStats places crimeTypes
        let byPlace = crimesByPlace crimes places
        let byType = crimesByType crimes crimeTypes
        let tree = learn crimes places crimeTypes
        let prediction = predict tree places
        let mtree = manualTree crimes
        let mprediction = manualpredict mtree places

        let app =
            choose
                [ 
                  GET >=> choose
                    [ 
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
                      pathScan "/api/predict/%s" (fun (a:string) -> json (prediction a))              
                      pathScan "/api/mpredict/%s" (fun (a:string) -> json (mprediction a))              
                     ]          
                ]

        let port = 
            match IISHelpers.httpPlatformPort with
            | Some port -> port
            | None -> 8083

        startWebServer { defaultConfig with homeFolder = Some __SOURCE_DIRECTORY__; bindings = [ HttpBinding.mkSimple HTTP "127.0.0.1" port ] } app
        0