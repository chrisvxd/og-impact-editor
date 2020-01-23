import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';

import AceEditor from 'react-ace';
import SplitPane from 'react-split-pane';
import Frame from 'react-frame-component';
import debounce from 'lodash.debounce';
import axios from 'axios';
import handlebars from 'handlebars';

import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';

import qs from 'qs';

import './App.css';
import 'normalize.css';

import htmlExample from './html-example';
import cssExample from './css-example';

import { writeStorage, useLocalStorage } from '@rehooks/local-storage';
import ClipLoader from 'react-spinners/ClipLoader';

const host = 'https://ssfy.sh/chrisvxd/og-impact';

const Editor = ({ label, mode, ...props }) => (
  <div className="Editor">
    <div className="Editor-title">{label}</div>
    <AceEditor
      mode={mode}
      theme="monokai"
      name={`${mode.toUpperCase()}Editor`}
      height="100%"
      width="100%"
      wrapEnabled
      {...props}
    />
  </div>
);

const Button = ({ children, onClick }) => {
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="Button"
      disabled={loading}
      onClick={async () => {
        console.log('Clicked buton');
        setLoading(true);
        await onClick();
        setLoading(false);
      }}>
      {children}
    </button>
  );
};

const debouncedFetchPreview = debounce(
  async (data, setUri, setLoading) => {
    setLoading(true);

    const response = await axios.post(`${host}/preview`, data, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'image/*'
      }
    });

    if (response.headers['content-type']) {
      if (response.headers['content-type'].startsWith('image/')) {
        const b64 = new Buffer(response.data, 'binary').toString('base64');
        const dataUri =
          'data:' + response.headers['content-type'] + ';base64,' + b64;

        setUri(dataUri);
      }
    }

    setLoading(false);
  },
  1000,
  { maxWait: 5000 }
);

const Preview = ({ html, css, params }) => {
  const [dataUri, setDataUri] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    debouncedFetchPreview(
      {
        body: html,
        styles: css,
        ...params
      },
      setDataUri,
      setLoading
    );
  }, [html, css, params]);

  const [debouncedHtml] = useDebounce(html, 500);
  const [debouncedParams] = useDebounce(params, 500);
  const [compiledHtml, setCompiledHtml] = useState(() => {
    try {
      return handlebars.compile(html)(params);
    } catch (e) {
      console.warn('Error when compiling handlebars, using raw HTML');
      console.warn(e);

      return html;
    }
  });

  useEffect(() => {
    try {
      const compiled = handlebars.compile(debouncedHtml)(debouncedParams);

      setCompiledHtml(compiled);
    } catch (e) {
      console.warn('Error when compiling handlebars, using raw HTML');
      console.warn(e);
      setCompiledHtml(debouncedHtml);
    }
  }, [debouncedHtml, debouncedParams]);

  return (
    <div className="Preview">
      <div className="Preview-item">
        <div className="Preview-title">iframe Preview</div>

        <Frame
          className="Preview-frame"
          head={
            <>
              <style type="text/css">
                {`
                body, html, .frame-root, .frame-content , .frame-content > div {
                  height: 100%;
                  padding: 0;
                  margin: 0;
                }
            `}
              </style>
              <style type="text/css">{css}</style>
            </>
          }>
          <div dangerouslySetInnerHTML={{ __html: compiledHtml }} />
        </Frame>
      </div>
      <div className="Preview-item">
        <div className="Preview-title">Image Preview</div>
        <div className="Preview-subtitle">
          {`https://ogi.sh?${qs.stringify({
            template: 'a1b2c3d',
            ...params
          })}`}
        </div>

        <div className="Preview-itemContent">
          <div
            style={{
              background: 'white',
              borderRadius: 8,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: '#CCD6DD',
              boxShadow: '0 2px 16px #d8d8d8',
              color: 'black',
              margin: 16,
              fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif',
              width: 507
            }}>
            <div
              style={{
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundImage: `url("${dataUri}")`,
                borderTopLeftRadius: 7,
                borderTopRightRadius: 7,
                width: '100%',
                height: 266,
                overflow: 'hidden'
              }}
            />
            <div
              style={{
                borderTopWidth: 1,
                borderTopStyle: 'solid',
                borderTopColor: '#CCD6DD',
                padding: 8
              }}>
              <div style={{ marginBottom: 4 }}>Web page</div>
              <div style={{ color: 'rgb(101, 119, 134)', marginBottom: 4 }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </div>
              <div style={{ color: 'rgb(101, 119, 134)' }}>example.com</div>
            </div>
          </div>

          {loading && (
            <div
              style={{
                margin: 16,
                marginTop: 0,
                position: 'absolute',
                bottom: 8,
                right: 8
              }}>
              <ClipLoader width={16} height={16} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const debouncedWriteStorage = debounce(
  async (html, css, params) => {
    writeStorage('html', html);
    writeStorage('css', css);
    writeStorage('params', params);
  },
  1000,
  { maxWait: 5000 }
);

const App = () => {
  const [storedHtml] = useLocalStorage('html');
  const [storedCss] = useLocalStorage('css');
  const [storedParams] = useLocalStorage('params');

  const [html, setHtml] = useState(storedHtml || htmlExample);
  const [css, setCss] = useState(storedCss || cssExample);
  const [params, setParams] = useState(
    storedParams || { title: 'Hello, World!' }
  );
  const [paramsJson, setParamsJson] = useState(JSON.stringify(params, null, 2));
  const [apiKey, setApiKey] = useState('');

  const publish = useCallback(async () => {
    const response = await axios.post(
      `${host}/register`,
      { body: html, styles: css },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey
        }
      }
    );

    alert(`Save successful. Use template ID ${response.data.template}.`);
  }, [html, css, apiKey]);

  useEffect(() => {
    debouncedWriteStorage(html, css, params);
  }, [html, css, params]);

  return (
    <div className="App">
      <header className="Header">
        <div className="Header-logo">
          <svg width="200px" viewBox="0 0 686 179" version="1.1">
            <g
              id="Logo-Light"
              stroke="none"
              stroke-width="1"
              fill="none"
              fill-rule="evenodd">
              <path
                d="M4.55200153,88.176 C4.55200153,80.9226304 5.83198873,74.3733626 8.39200153,68.528 C10.9520143,62.6826374 14.4719791,57.7120205 18.9520015,53.616 C23.4320239,49.5199795 28.7439708,46.3626778 34.8880015,44.144 C41.0320322,41.9253222 47.6879657,40.816 54.8560015,40.816 C62.0240374,40.816 68.6799708,41.9253222 74.8240015,44.144 C80.9680322,46.3626778 86.3013122,49.5199795 90.8240015,53.616 C95.3466908,57.7120205 98.8879887,62.6826374 101.448002,68.528 C104.008014,74.3733626 105.288002,80.9226304 105.288002,88.176 C105.288002,95.4293696 104.008014,102.042637 101.448002,108.016 C98.8879887,113.989363 95.3466908,119.087979 90.8240015,123.312 C86.3013122,127.536021 80.9680322,130.799988 74.8240015,133.104 C68.6799708,135.408012 62.0240374,136.56 54.8560015,136.56 C47.6879657,136.56 41.0320322,135.408012 34.8880015,133.104 C28.7439708,130.799988 23.4320239,127.536021 18.9520015,123.312 C14.4719791,119.087979 10.9520143,113.989363 8.39200153,108.016 C5.83198873,102.042637 4.55200153,95.4293696 4.55200153,88.176 Z M36.9360015,88.176 C36.9360015,91.1626816 37.383997,93.893321 38.2800015,96.368 C39.176006,98.842679 40.413327,100.975991 41.9920015,102.768 C43.5706761,104.560009 45.4693238,105.946662 47.6880015,106.928 C49.9066793,107.909338 52.2959887,108.4 54.8560015,108.4 C57.4160143,108.4 59.7839906,107.909338 61.9600015,106.928 C64.1360124,105.946662 66.0346601,104.560009 67.6560015,102.768 C69.277343,100.975991 70.535997,98.842679 71.4320015,96.368 C72.328006,93.893321 72.7760015,91.1626816 72.7760015,88.176 C72.7760015,85.2746522 72.328006,82.6080122 71.4320015,80.176 C70.535997,77.7439878 69.277343,75.6960083 67.6560015,74.032 C66.0346601,72.3679917 64.1360124,71.0666714 61.9600015,70.128 C59.7839906,69.1893286 57.4160143,68.72 54.8560015,68.72 C52.2959887,68.72 49.9066793,69.1893286 47.6880015,70.128 C45.4693238,71.0666714 43.5706761,72.3679917 41.9920015,74.032 C40.413327,75.6960083 39.176006,77.7439878 38.2800015,80.176 C37.383997,82.6080122 36.9360015,85.2746522 36.9360015,88.176 Z M155.068001,136.304 C147.899965,136.304 141.265365,135.194678 135.164001,132.976 C129.062637,130.757322 123.772024,127.578687 119.292001,123.44 C114.811979,119.301313 111.292014,114.288029 108.732001,108.4 C106.171988,102.511971 104.892001,95.9413696 104.892001,88.688 C104.892001,81.4346304 106.171988,74.8640294 108.732001,68.976 C111.292014,63.0879706 114.790646,58.0533542 119.228001,53.872 C123.665357,49.6906458 128.870638,46.4693446 134.844001,44.208 C140.817364,41.9466554 147.2173,40.816 154.044001,40.816 C161.126703,40.816 167.846636,41.9679885 174.204001,44.272 C180.561366,46.5760115 185.745314,49.7333133 189.756001,53.744 L171.964001,75.12 C170.086658,72.9013222 167.868014,71.1306733 165.308001,69.808 C162.747988,68.4853267 159.590687,67.824 155.836001,67.824 C153.361322,67.824 150.95068,68.3146618 148.604001,69.296 C146.257323,70.2773382 144.18801,71.6853242 142.396001,73.52 C140.603992,75.3546758 139.15334,77.5519872 138.044001,80.112 C136.934662,82.6720128 136.380001,85.5306509 136.380001,88.688 C136.380001,95.0026982 138.022651,100.14398 141.308001,104.112 C144.593351,108.08002 149.862632,110.064 157.116001,110.064 C158.396008,110.064 159.718661,109.957334 161.084001,109.744 C162.449341,109.530666 163.515997,109.210669 164.284001,108.784 L164.284001,101.872 L149.692001,101.872 L149.692001,77.936 L191.292001,77.936 L191.292001,127.472 C189.158657,128.752006 186.705348,129.925328 183.932001,130.992 C181.158654,132.058672 178.214683,132.975996 175.100001,133.744 C171.985319,134.512004 168.721352,135.130664 165.308001,135.6 C161.894651,136.069336 158.481352,136.304 155.068001,136.304 Z M220.324,43.376 L251.044,43.376 L251.044,134 L220.324,134 L220.324,43.376 Z M285.848,82.8 L287.256,134 L258.84,134 L258.84,43.376 L298.648,43.376 L315.032,92.144 L315.672,92.144 L329.88,43.376 L370.968,43.376 L370.968,134 L341.4,134 L342.296,83.056 L341.528,82.928 L324.632,134 L303.128,134 L286.488,82.8 L285.848,82.8 Z M409.1,104.816 L409.1,134 L378.764,134 L378.764,43.376 L417.676,43.376 C422.284023,43.376 426.806644,43.8666618 431.244,44.848 C435.681355,45.8293382 439.649315,47.4933216 443.148,49.84 C446.646684,52.1866784 449.462656,55.3013139 451.596,59.184 C453.729344,63.0666861 454.796,67.9519706 454.796,73.84 C454.796,79.4720282 453.750677,84.250647 451.66,88.176 C449.569322,92.101353 446.796017,95.301321 443.34,97.776 C439.883982,100.250679 435.916022,102.042661 431.436,103.152 C426.955977,104.261339 422.369356,104.816 417.676,104.816 L409.1,104.816 Z M409.1,67.056 L409.1,81.648 L415.5,81.648 C417.804011,81.648 419.91599,81.0720058 421.836,79.92 C423.756009,78.7679942 424.716,76.8266803 424.716,74.096 C424.716,72.6453261 424.460002,71.4720045 423.948,70.576 C423.435997,69.6799955 422.732004,68.9760026 421.836,68.464 C420.939995,67.9519974 419.937338,67.5893344 418.828,67.376 C417.718661,67.1626656 416.609338,67.056 415.5,67.056 L409.1,67.056 Z M474.751999,43.376 L507.135999,43.376 L542.463999,134 L509.311999,134 L504.575999,120.688 L475.775999,120.688 L471.295999,134 L439.039999,134 L474.751999,43.376 Z M490.495999,74.992 L483.071999,97.392 L497.791999,97.392 L490.495999,74.992 Z M533.363999,88.688 C533.363999,81.4346304 534.643986,74.8640294 537.203999,68.976 C539.764012,63.0879706 543.262643,58.0533542 547.699999,53.872 C552.137354,49.6906458 557.363969,46.4693446 563.379999,44.208 C569.396029,41.9466554 575.817298,40.816 582.643999,40.816 C589.641367,40.816 596.254634,41.9466554 602.483999,44.208 C608.713363,46.4693446 613.918645,49.5199808 618.099999,53.36 L599.411999,75.888 C597.705324,73.6693222 595.572012,71.9840058 593.011999,70.832 C590.451986,69.6799942 587.593348,69.104 584.435999,69.104 C581.875986,69.104 579.486677,69.5519955 577.267999,70.448 C575.049321,71.3440045 573.108007,72.6453248 571.443999,74.352 C569.779991,76.0586752 568.47867,78.1279878 567.539999,80.56 C566.601327,82.9920122 566.131999,85.7013184 566.131999,88.688 C566.131999,91.6746816 566.622661,94.3413216 567.603999,96.688 C568.585337,99.0346784 569.907991,101.061325 571.571999,102.768 C573.236007,104.474675 575.177321,105.775996 577.395999,106.672 C579.614677,107.568004 581.96132,108.016 584.435999,108.016 C587.934683,108.016 590.942653,107.290674 593.459999,105.84 C595.977345,104.389326 597.961325,102.682676 599.411999,100.72 L618.099999,123.12 C614.003978,127.21602 608.969362,130.479988 602.995999,132.912 C597.022636,135.344012 590.238703,136.56 582.643999,136.56 C575.817298,136.56 569.396029,135.408012 563.379999,133.104 C557.363969,130.799988 552.137354,127.536021 547.699999,123.312 C543.262643,119.087979 539.764012,114.053363 537.203999,108.208 C534.643986,102.362637 533.363999,95.8560358 533.363999,88.688 Z M662.631998,134 L632.167998,134 L632.167998,69.104 L609.895998,69.104 L609.895998,43.376 L684.903998,43.376 L684.903998,69.104 L662.631998,69.104 L662.631998,134 Z"
                id="OGIMPACT"
                fill="#FFFFFF"
                fill-rule="nonzero"></path>
            </g>
          </svg>
          <div className="Header-logoProduct">Editor BETA</div>
        </div>
        <div className="Header-actions">
          <input
            type="text"
            placeholder="API Key"
            value={apiKey}
            onChange={setApiKey}
            style={{
              border: 'none',
              borderRadius: 4,
              fontSize: 16,
              padding: '12px 16px',
              width: 200,
              marginRight: 16
            }}
          />
          <Button onClick={publish}>Publish</Button>
        </div>
      </header>

      <main className="Main">
        <section style={{ height: '100%', position: 'relative', flexGrow: 1 }}>
          <SplitPane defaultSize="66.7%" split="vertical">
            <SplitPane defaultSize="50%" split="vertical" primary="second">
              <Editor
                label="HTML / Handlebars"
                mode="html"
                onChange={setHtml}
                value={html}
              />

              <Editor label="CSS" mode="css" onChange={setCss} value={css} />
            </SplitPane>

            <Editor
              label="Params"
              mode="json"
              onChange={val => {
                try {
                  setParams(JSON.parse(val));
                  setParamsJson(val);
                } catch {
                  console.warn('Error parsing JSON');
                }
              }}
              value={paramsJson}
            />
          </SplitPane>
        </section>

        <Preview html={html} css={css} params={params} />
      </main>
    </div>
  );
};

export default App;
