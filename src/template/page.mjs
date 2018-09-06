export function renderBlankPage(application, pageName) {
  return `module ${application}.Page.${pageName} exposing (Route, Model, Msg, route, page)

import ${application}.Root as Root
import UrlParser as UrlParser exposing (Parser, s, (</>), map)
import Navigation exposing (Location, newUrl)

type Msg
  = Navigate String


type alias Model =
  {}


type alias Route =
  ()

route : Parser (Route -> a) a
route =
    map () (s "${pageName.toLowerCase()}")


init : Location -> Route -> Root.Model -> ( Model, Cmd Msg )
init _ _ rootModel =
    ( {}, Cmd.none )


receive : Root.DescentMsg -> Maybe Msg
receive msg =
    Nothing
    

update : Msg -> Root.Model -> Model -> ( Root.Model, Model, Cmd Msg )
update msg rootModel model =
  case msg of
    Navigate url ->
      ( rootModel, model, newUrl url )


subscriptions : Root.Model -> Sub Msg
subscriptions model =
    Sub.none


{-| Auto-generated link function for path routing (\`UrlParser.parsePath\`). 
You can remove this function if you use Hash routing (\`UrlParser.parseHash\`).
-}
link : String -> String -> Html Msg
link href label =
    Root.navigate Navigate href [ text label ]

view : Root.Model -> Model -> Html Msg
view state model = div [] 
  [ h1 [] [text "${pageName}"]
  ]

page : Root.Page Route Model Msg
page = 
  { init = init
  , view = view
  , update = update
  , subscriptions = subscriptions
  }

  `;
}