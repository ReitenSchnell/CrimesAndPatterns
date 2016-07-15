let sum x =
    let sumOne y =
        x + y
    sumOne

let printHello() = printfn "hello"

module Person =

    type T = {First:string; Last:string} with
        member this.FullName =
            this.First + " " + this.Last

        static member Populate first last =
            {First = first; Last = last}
            
    let create first last =
         {First=first; Last=last}

    type T with
        member this.SortableName =
            this.Last + " " + this.First

module PersonExtension =
    type Person.T with
        member this.UppercaseName =
            this.FullName.ToUpper()

    type System.Int32 with
        member this.IsEven = 
            this % 2 = 0

let p = Person.create "Jown" "Dow"
let full = p.FullName
let sortable = p.SortableName
open PersonExtension
let uppercase = p.UppercaseName
let i = 20
let even = i.IsEven
let p2 = Person.T.Populate "Foo" "Boo"
