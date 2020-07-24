let gcodePreview;

const startLayer = document.getElementById('start-layer');
const endLayer = document.getElementById('end-layer');
const toggleSingleLayerMode = document.getElementById('single-layer-mode');
const toggleExtrusion = document.getElementById('extrusion');
const toggleTravel = document.getElementById('travel');
const toggleHighlight = document.getElementById('highlight');
const layerCount = document.getElementById('layer-count');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const snapshot = document.getElementById('snapshot');
// const lineWidth = document.getElementById('line-width');

function initDemo() {
  const preview = (window.preview = new GCodePreview.WebGLPreview({
    canvas: document.querySelector('.gcode-previewer'),
    // targetId : 'renderer',
    topLayerColor: new THREE.Color(`hsl(180, 50%, 50%)`).getHex(),
    lastSegmentColor: new THREE.Color(`hsl(270, 50%, 50%)`).getHex(),
    // lineWidth: 4
  }));

  preview.renderExtrusion = true;
  preview.renderTravel = false;

  startLayer.addEventListener('input', function(evt) {
    preview.startLayer = +startLayer.value;
    endLayer.value = preview.endLayer = Math.max(preview.startLayer, preview.endLayer);
    preview.render();
  });

  endLayer.addEventListener('input', function(evt) {
    preview.endLayer = +endLayer.value;
    startLayer.value = preview.startLayer = Math.min(preview.startLayer, preview.endLayer);
    preview.render();
  });

  toggleSingleLayerMode.addEventListener('click', function() {
    preview.singleLayerMode = toggleSingleLayerMode.checked;
    if (preview.singleLayerMode) {
      startLayer.setAttribute('disabled', 'disabled');
    } 
    else {
      startLayer.removeAttribute('disabled');
    }
    preview.render();
  });

  toggleExtrusion.addEventListener('click', function() {
    preview.renderExtrusion = toggleExtrusion.checked;
    preview.render();
  });

  toggleTravel.addEventListener('click', function() {
    preview.renderTravel = toggleTravel.checked;
    preview.render();
  });

  toggleHighlight.addEventListener('click', function() {
    if (toggleHighlight.checked) {
      preview.topLayerColor = new THREE.Color(`hsl(180, 50%, 50%)`).getHex();
      preview.lastSegmentColor = new THREE.Color(`hsl(270, 50%, 50%)`).getHex();
    } else {
      preview.topLayerColor = undefined;
      preview.lastSegmentColor = undefined;
    }
    preview.render();
  });

  // lineWidth.addEventListener('change', function() {
  //   preview.lineWidth = parseInt(lineWidth.value,10);
  //   preview.render();
  // });

  window.addEventListener('resize', function() {
    preview.resize();
  });

  preview.canvas.addEventListener('dragover', function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy';
      document.body.className = "dragging";
  });

  preview.canvas.addEventListener('dragleave', function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      document.body.className = "";
  });

  preview.canvas.addEventListener('drop', function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      document.body.className = "";
      const files = evt.dataTransfer.files;
      const file = files[0];
      loadGCode(file);
  });

  snapshot.addEventListener('click', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    Canvas2Image.saveAsJPEG(gcodePreview.canvas,innerWidth, innerHeight, fileName.innerText.replace('.gcode','.jpg'));
  });

  gcodePreview = preview;

  updateUI();

  return preview;
}

function updateUI() {
  startLayer.setAttribute('max', gcodePreview.layers.length);
  endLayer.setAttribute('max', gcodePreview.layers.length);
  endLayer.value = gcodePreview.layers.length;
  
  layerCount.innerText =
    gcodePreview.layers && gcodePreview.layers.length + ' layers';

  // console.log(gcodePreview.layers);

  if (gcodePreview.renderExtrusion)
    toggleExtrusion.setAttribute('checked', 'checked');
  else toggleExtrusion.removeAttribute('checked');

  if (gcodePreview.renderTravel)
    toggleTravel.setAttribute('checked', 'checked');
  else toggleTravel.removeAttribute('checked');

  if (gcodePreview.topLayerColor !== undefined)
    toggleHighlight.setAttribute('checked', 'checked');
  else toggleHighlight.removeAttribute('checked');
}

function loadGCode(file) {
  const reader = new FileReader();
  reader.onload = function() {
    _handleGCode(file.name, reader.result);
  };
  reader.readAsText(file);
  fileName.setAttribute('href', '#');
}

async function loadGCodeFromServer(file) {
  const response = await fetch(file);

  if (response.status !== 200) {
    console.error('ERROR. Status Code: ' + response.status);
    return;
  }

  const gcode = await response.text();
  _handleGCode(file, gcode);
  fileName.setAttribute('href', file);
}

function _handleGCode(filename, gcode) {
  fileName.innerText = filename;
  fileSize.innerText = humanFileSize(gcode.length);

  updateUI();

  startLoadingProgressive(gcode);
}

function startLoadingProgressive(gcode) {
  let c = 0;
  startLayer.setAttribute('disabled', 'disabled');
  endLayer.setAttribute('disabled', 'disabled');
  function loadProgressive() {
    const start = c * chunkSize;
    const end = (c + 1) * chunkSize;
    const chunk = lines.slice(start, end);
    
    c++;
    if (c < chunks) {
      window.__loadTimer__ = requestAnimationFrame(loadProgressive)
    }
    else {
      startLayer.removeAttribute('disabled');
      endLayer.removeAttribute('disabled');
    }
    gcodePreview.processGCode(chunk);
    updateUI();
  }

  const lines = gcode.split('\n');
  console.log('lines', lines.length);
  const chunkSize = 1000;
  console.log('chunk size', chunkSize);
  const chunks = lines.length / chunkSize;
  console.log('chunks', chunks);
  console.log('loading');
  gcodePreview.clear();
  if (window.__loadTimer__) clearTimeout(window.__loadTimer__);
  loadProgressive();
}

function humanFileSize(size) {
  var i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Math.pow(1024, i)).toFixed(2) * 1 +
    ' ' +
    ['B', 'kB', 'MB', 'GB', 'TB'][i]
  );
}
const octoprint = {
  ip: null,
  apiKey: null,
  queue: 0,
  gcode: 1,
  filepos: 0,
  loaded: false
}

const ipAddress = document.getElementById('octoprint-ip');
const apiKey = document.getElementById('octoprint-key');

async function connectToOctoprint() {
  console.log('connectToOctoprint')
  octoprint.ip = ipAddress.value;
  octoprint.apiKey = apiKey.value;
  await connect(octoprint.ip, octoprint.apiKey)
}

document.getElementById('connect-to-octoprint').addEventListener('click', connectToOctoprint);

async function connect(ip, apiKey) {
  console.log('connecting')
  const session = await login(ip, apiKey);

  this.socket = subscribe(ip, session);
  this.socket.onmessage = ev => {
    var data = JSON.parse(ev.data);
    if (!data.current) {
      return;
    }
    const oks = data.current.logs.filter(l => l.indexOf('Recv: ok') > -1)
      .length;
    octoprint.queue -= oks;
    onmessage(data);
  };
  this.socket.onclose = this.onClose;
}

async function login(ip, apikey) {
  const response = await fetch(`http://${ip}/api/login?apikey=${apikey}`, {
    method: 'post',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ passive: true })
  });
  return await response.json();
}


function subscribe(ip, session) {
  const ws = new WebSocket(`ws://${ip}/sockjs/websocket`);
  ws.onopen = function() {
    console.log('ws opened');
    ws.send(JSON.stringify({ auth: `${session.name}:${session.session}` }));
  };

  return ws;
}

async function onmessage(data) {
  // 
  if (data.current) {

    // console.log(data.current.busyFiles[0].path);
    console.log(data.current.progress.filepos, data.current.job.file.size);
    
    if (octoprint.loaded)
    {
      const newPos = data.current.progress.filepos;
      const chunk = octoprint.gcode.slice(octoprint.filepos, newPos)
      preview.processGCode(chunk);
      octoprint.filepos = newPos;
    }


    if (octoprint.gcode == 1) {
      const file = data.current.job.file;
      console.log(file.origin, data.current.job.file.path);
      octoprint.gcode = 2;
      // get gcode
      const options = {
        headers: {'X-Api-Key:': octoprint.apiKey},
      };
      const json  = await (await fetch(`http://${octoprint.ip}/api/files/${file.origin}/${file.path}?apikey=${octoprint.apiKey}`)).json();
      console.log(json.refs.download)
      octoprint.gcode =  await (await fetch(json.refs.download)) .text();
      octoprint.loaded = true;
    }
  }
  // this.heartbeat();
}
