namespace CEServer

open Newtonsoft.Json
open Newtonsoft.Json.Serialization
open Suave.Successful
open Suave
open Suave.Operators

module Web =
    let json v =
        let settings = new JsonSerializerSettings()
        settings.ContractResolver <- new CamelCasePropertyNamesContractResolver()
        JsonConvert.SerializeObject(v, settings)
        |> OK 
        >=> Writers.setMimeType "application/json; charset=utf-8"
        >=> Writers.setHeader "Access-Control-Allow-Origin" "*"
        >=> Writers.setHeader "Access-Control-Allow-Headers" "content-type"

    

