#I @"..\packages\"
#r @"Suave.1.1.3\lib\net40\Suave.dll"
#r @"Newtonsoft.Json.8.0.3\lib\net40\Newtonsoft.Json.dll"
#r @"FSharp.Data.2.3.0\lib\net40\FSharp.Data.dll"
#r @"Accord.3.0.2\lib\net45\Accord.dll"
#r @"Accord.MachineLearning.3.0.2\lib\net45\Accord.MachineLearning.dll"
#r @"Accord.Statistics.3.0.2\lib\net45\Accord.Statistics.dll"
#r @"Accord.Math.3.0.2\lib\net45\Accord.Math.dll"
#load "Web.fs"
#load "Data.fs"

open Suave
open Suave.Filters
open Suave.Successful
open Suave.Operators
open System
open Suave.Json
open Suave.Files
open CEServer.Web
open CEServer.Data
open Suave.Redirection
open Suave.Writers

let data = prepareData
let places = getPossibleValues extractPlace data
let types = getPossibleValues extractType data
let byPlace = crimesByPlace data
let byType = crimesByType data
let accuracy = learn data

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
              path "/world.json" >=> file "world.json"; browseHome
              path "/api/places" >=> json places
              path "/api/crimes/byplace" >=> json byPlace
              path "/api/crimes/bytype" >=> json byType
              path "/api/types" >=> json types
              path "/api/accuracy" >=> json accuracy
             ]          
        ]

startWebServer { defaultConfig with homeFolder = Some @"C:\Repository\Learning\TinyML\CEClient\build" } app

