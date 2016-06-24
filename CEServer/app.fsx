#I @"..\packages\"
#r @"Suave.1.1.3\lib\net40\Suave.dll"
#r @"Newtonsoft.Json.8.0.3\lib\net40\Newtonsoft.Json.dll"
#r @"FSharp.Data.2.3.0\lib\net40\FSharp.Data.dll"
#load "Web.fs"
#load "Data.fs"

open Suave
open Suave.Filters
open Suave.Successful
open Suave.Operators
open System
open Suave.Json
open CEServer.Web
open CEServer.Data


let data = prepareData
let places = getPossibleValues extractPlace data
let types = getPossibleValues extractType data
let byPlace = crimesByPlace data
let byType = crimesByType data

let app =
    choose
        [ GET >=> choose
            [ path "/places" >=> json places
              path "/crimes/byplace" >=> json byPlace
              path "/crimes/bytype" >=> json byType
              path "/types" >=> json types]
        ]

startWebServer defaultConfig app

