const TOP_LAYER_COLOR = new THREE.Color(`hsl(180, 50%, 50%)`).getHex();
const LAST_SEGMENT_COLOR = new THREE.Color(`hsl(270, 50%, 50%)`).getHex();

const data = {
  renderTravel: false,
  renderExtrusion : true,
  startLayer: 1,
  endLayer: 0,
  singleLayerMode: null,
  highlightTopLayer: true,
  layerCount: 0,
  fileName: null,
  fileSize: 0,
  loading: false
};

const vm = new Vue({
  el: '#app',
  data: data,
  mounted() {
    this.preview = new GCodePreview.WebGLPreview({
      canvas: document.querySelector('.gcode-previewer'),
      topLayerColor: TOP_LAYER_COLOR,
      lastSegmentColor: LAST_SEGMENT_COLOR
    });
    
    window.addEventListener('resize', () => this.preview.resize());
  },
  methods: {
    updateSettings() {
      this.preview.renderTravel = this.renderTravel;
      this.preview.renderExtrusion = this.renderExtrusion;
      this.preview.singleLayerMode = this.singleLayerMode;
      this.preview.startLayer = this.startLayer;
      this.preview.endLayer = this.endLayer;

      if (this.highlightTopLayer) {
        this.preview.topLayerColor = TOP_LAYER_COLOR;
        this.preview.lastSegmentColor = LAST_SEGMENT_COLOR;
      } else {
        this.preview.topLayerColor = undefined;
        this.preview.lastSegmentColor = undefined;
      }
    },
    render: function() {
      this.updateSettings();
      this.preview.render();
    },
    saveSnapshot() {
      Canvas2Image.saveAsJPEG(this.preview.canvas, innerWidth, innerHeight, this.fileName.replace('.gcode','.jpg'));
    },
    _handleGCode(filename, gcode) {
      this.fileName = filename;
      this.fileSize = humanFileSize(gcode.length);
      this.loading = true;
      let c = 0;
      
      const loadProgressive = () => {
        const start = c * chunkSize;
        const end = (c + 1) * chunkSize;
        const chunk = lines.slice(start, end);
        
        c++;
        if (c < chunks) {
          window.__loadTimer__ = requestAnimationFrame(loadProgressive)
        }
        else {
          this.loading = false;
        }
        this.preview.processGCode(chunk);
        this.layerCount = this.endLayer = this.preview.layers.length;
      }
    
      const lines = gcode.split('\n');
      const chunkSize = 1000;
      const chunks = lines.length / chunkSize;
      this.preview.clear();
      if (window.__loadTimer__) clearTimeout(window.__loadTimer__);
      loadProgressive();
    },
    dragover(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy';
      document.body.className = "dragging";
    },
    dragleave(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      document.body.className = "";
    },
    drop(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      document.body.className = "";
      const files = evt.dataTransfer.files;
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => this._handleGCode(file.name, reader.result);
      reader.readAsText(file);
      this.fileName = '';
    },
    async loadGCodeFromServer(file) {
      const response = await fetch(file);
    
      if (response.status !== 200) {
        console.error('ERROR. Status Code: ' + response.status);
        return;
      }
    
      const gcode = await response.text();
      this._handleGCode(file, gcode);
    }
  }
});

function humanFileSize(size) {
  var i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Math.pow(1024, i)).toFixed(2) * 1 +
    ' ' +
    ['B', 'kB', 'MB', 'GB', 'TB'][i]
  );
}
