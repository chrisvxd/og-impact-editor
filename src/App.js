import React, { useState, useEffect, useCallback } from 'react';

import AceEditor from 'react-ace';
import SplitPane from 'react-split-pane';
import Frame from 'react-frame-component';
import debounce from 'lodash.debounce';
import axios from 'axios';

import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';

import qs from 'qs';

import './App.css';
import 'normalize.css';

import 'react-splitter-layout/lib/index.css';

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

  return (
    <div className="Preview">
      <div className="Preview-item">
        <div className="Preview-title">Local Preview (iframe)</div>

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
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </Frame>
      </div>
      <div className="Preview-item">
        <div className="Preview-title">Rendered Preview</div>
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
          <svg width="200px" viewBox="0 0 681 97">
            <title>OG IMPACT</title>
            <desc>Created with Sketch.</desc>
            <g
              id="Page-1"
              stroke="none"
              stroke-width="1"
              fill="none"
              fill-rule="evenodd"
              font-family="AvenirNext-Heavy, Avenir Next"
              font-size="128"
              font-weight="600"
              letter-spacing="-9.10000038">
              <g
                id="Logo-Light"
                transform="translate(-4.000000, -40.000000)"
                fill="#FFFFFF">
                <text id="OG-IMPACT">
                  <tspan x="0.200001526" y="134">
                    OG IMPAC
                  </tspan>
                  <tspan x="608.999998" y="134">
                    T
                  </tspan>
                </text>
              </g>
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
              padding: '0 16px',
              height: '100%',
              width: 200,
              marginRight: 24
            }}
          />
          <Button onClick={publish}>Publish</Button>
        </div>
      </header>

      <main className="Main">
        <section style={{ height: '100%', position: 'relative' }}>
          <SplitPane defaultSize="66.7%" split="vertical">
            <SplitPane defaultSize="50%" split="vertical" primary="second">
              <Editor
                label="HTML"
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
