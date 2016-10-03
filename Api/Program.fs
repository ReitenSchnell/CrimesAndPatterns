open System.IO
open Newtonsoft.Json
open Newtonsoft.Json.Serialization
open Suave
open Suave.Filters
open Suave.Successful
open Suave.Operators
open Suave.Redirection
open Suave.Files
open System

module IISHelpers =
    open System

    let httpPlatformPort =
        match Environment.GetEnvironmentVariable("HTTP_PLATFORM_PORT") with
        | null -> None
        | value ->
            match Int32.TryParse(value) with
            | true, value -> Some value
            | false, _ -> None

module DataTypes = 
    type Statistics = {Label : string; Value : float; Fraction : string; Percentage : float}    
    type Entity = {Label: string; Id : int}
    type Prediction = {Place:string; Found:int}
    type Stat = {Type : string; Percent : string}
    type Similars = {Place : string; Cluster : int; Stats : Stat[]}
    type Preprocessed = {ByPlace:Statistics list; ByType:Statistics list; CrimeTypes:Entity list; SimilarPlaces:Similars list; SimilarPlacesWithSuspect:Similars list; Predictions : Map<int, Prediction list>}

module Web =
    let json v =
        let settings = new JsonSerializerSettings()
        settings.ContractResolver <- new CamelCasePropertyNamesContractResolver()
        JsonConvert.SerializeObject(v, settings)
        |> OK 
        >=> Writers.setMimeType "application/json; charset=utf-8"
        >=> Writers.setHeader "Access-Control-Allow-Origin" "*"
        >=> Writers.setHeader "Access-Control-Allow-Headers" "content-type"

[<EntryPoint>]
let main argv =        
    let readData =
        let preprocessedfile = Directory.GetCurrentDirectory() + "\preprocessed.json"
        let serialized = File.ReadAllText preprocessedfile
        let dump = JsonConvert.DeserializeObject<DataTypes.Preprocessed>(serialized)
        dump

    let dump = readData
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
                      path "/templates.js" >=> file "templates.js"; browseHome
                      path "/tregions.json" >=> file "tregions.json"; browseHome
                      path "/fonts/glyphicons-halflings-regular.woff2" >=> file "glyphicons-halflings-regular.woff2"; browseHome
                      path "/fonts/glyphicons-halflings-regular.eot" >=> file "glyphicons-halflings-regular.eot"; browseHome
                      path "/fonts/glyphicons-halflings-regular.svg" >=> file "glyphicons-halflings-regular.svg"; browseHome
                      path "/fonts/glyphicons-halflings-regular.ttf" >=> file "glyphicons-halflings-regular.ttf"; browseHome
                      path "/fonts/glyphicons-halflings-regular.woff" >=> file "glyphicons-halflings-regular.woff"; browseHome
                      path "/favicon.ico" >=> file "favicon.ico"; browseHome
                      path "/uk.json" >=> file "uk.json"; browseHome
                      path "/api/crimes/byplace" >=> Web.json dump.ByPlace
                      path "/api/crimes/bytype" >=> Web.json dump.ByType
                      path "/api/types" >=> Web.json dump.CrimeTypes              
                      path "/api/similar/general" >=> Web.json dump.SimilarPlaces              
                      path "/api/similar/found" >=> Web.json dump.SimilarPlacesWithSuspect              
                      pathScan "/api/predict/%s" (fun (a:string) -> Web.json (dump.Predictions.[Int32.Parse a]))              
                     ]          
                ]

    let port = 
            match IISHelpers.httpPlatformPort with
            | Some port -> port
            | None -> 8083

    startWebServer { defaultConfig with homeFolder = Some __SOURCE_DIRECTORY__; bindings = [ HttpBinding.mkSimple HTTP "127.0.0.1" port ] } app        
      
    0
