export default `
.Background {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.Main {
  background: lightgray;
  font-family: "Avenir Next";
  position: relative;
  width: 100%;
  height: 100%;
  z-index: -2;
}

.Inner {
  align-items: center;
  display: flex;
  width: 100%;
  height: 100%;
}

.Content {
  padding: 32px;
  padding-top: 16px;
}

.Eyebrow {
  font-weight: 600;
  margin-bottom: 8px
}

h1, h2 {
  margin: 0;
  padding: 0;
  font-weight: 400;
  line-height: 1.2;
}

h1 {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
}

.Watermark {
  position: absolute;
  font-size: 18px;
  opacity: 0.8;
  left: 32px;
  bottom: 32px;
}

.Watermark-logo {
  font-weight: 700;
}

body, html {
  height: 100%;
  padding: 0;
  margin: 0;
}
`;
