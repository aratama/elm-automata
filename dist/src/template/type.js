"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.renderType = renderType;
function renderType(application, pageName) {
    return `module ${application}.Page.${pageName}.Type exposing (..)


type Msg
    = NoOp


type alias Model =
    {}


type alias Route =
    ()
`;
}