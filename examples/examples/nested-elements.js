// import React from "react";
// import ReactDOM from "react-dom";

function App() {
  return (
    <div className="panel">
      <div className="panel__table panel__line">
        <table>
          <tr>
            <td>
              <span className="panel__mute">Scope:</span>
            </td>
            <td className="panel__badge-col">
              <span className="panel__badge">fn</span>
            </td>
            <td>z-entity-gallery__thumbs</td>
          </tr>
          <tr>
            <td />
            <td className="panel__badge-col">
              <span className="panel__badge -purple">bem</span>
            </td>
            <td>
              <span className="panel__mute">block:</span>
              z-entity-gallery
              <span className="panel__mute"> | elem:</span>
              image
            </td>
          </tr>
          <tr>
            <td colspan="4" className="panel__table-sep" />
          </tr>
          <tr>
            <td>
              <span className="panel__mute">Parent:</span>
            </td>
            <td className="panel__badge-col">
              <span className="panel__badge -blue">P</span>
            </td>
            <td>z-entity-gallery</td>
          </tr>
          <tr>
            <td colspan="4" className="panel__table-sep" />
          </tr>
          <tr>
            <td>
              <span className="panel__mute">File:</span>
            </td>
            <td colspan="2" className="panel__files">
              <div className="panel__file">
                contribs/z-entity-search/blocks-deskpad/z-entity-gallery/__thumbs/z-entity-gallery__thumbs.priv.js:22
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
