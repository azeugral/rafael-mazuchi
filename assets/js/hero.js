/* Hero "puxada de serigrafia": o flash do Rafael é impresso tela por tela no algodão cru.
   Cada cor separada do desenho original (tools/separar.py) entra com uma passada de rodo,
   com a malha da tela aparecendo na tinta fresca e um leve fora de registro; o preto fecha.
   Desenha sobre BRANCO; o canvas/vídeo entra com mix-blend-mode:multiply sobre o pano. */
(function () {
  var PECAS = [
    { n: 'domino', c: [[158, 98, 52], [184, 163, 145], [177, 130, 96]] },
    { n: 'palhaco', c: [[46, 131, 158], [219, 60, 23], [160, 176, 178]] },
    { n: 'morango', c: [[220, 193, 168], [245, 74, 12], [15, 175, 160]] },
    { n: 'cinco', c: [[192, 123, 105], [117, 147, 158], [84, 76, 70]] }
  ];
  var CICLO = 5.2, INI = .12, PASSO = .4, DUR = .52;

  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;varying vec2 v;',
    'uniform sampler2D C,K;uniform float f,sd;uniform vec3 c0,c1,c2;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),q=fract(p);q=q*q*(3.-2.*q);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),q.x),mix(h(i+vec2(0,1)),h(i+1.),q.x),q.y);}',
    'float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p*=2.07;a*=.5;}return s;}',
    /* frente do rodo: desce de cima para baixo com a borda levemente torta */
    'float frente(float i,vec2 u){float p=clamp((f-' + INI + '-i*' + PASSO + ')/' + DUR + ',0.,1.);',
    ' p=p<.5?2.*p*p:1.-pow(-2.*p+2.,2.)/2.;',
    ' return p*1.16-.08+(n(vec2(u.x*3.,i*7.+sd))-.5)*.035+(u.x-.5)*.02*sin(i+sd);}',
    'float tinta(float m,float i,vec2 u){',
    ' float fr=frente(i,u);',
    ' float dep=smoothstep(fr+.004,fr-.012,u.y);',
    /* malha da tela: aparece na tinta recém-puxada e assenta logo depois */
    ' vec2 g=fract(u*vec2(210.));float malha=smoothstep(.18,.42,abs(g.x-.5))*smoothstep(.18,.42,abs(g.y-.5));',
    ' float fresco=1.-smoothstep(0.,.09,fr-u.y);',
    ' float borda=smoothstep(.25,.75,m+(fb(u*38.+i*3.)-.5)*.32);',
    ' float dens=.86+.14*fb(u*9.+i*11.+sd);',
    ' return borda*dep*dens*(1.-.55*fresco*(1.-malha));}',
    'void main(){vec2 u=vec2(v.x,1.-v.y);',
    /* fora de registro: cada tela um nadinha deslocada, como no pano de verdade */
    ' vec2 o0=vec2(sin(sd*2.1),cos(sd*1.3))*.0035,o1=vec2(cos(sd*3.7),sin(sd*2.9))*.003,o2=vec2(sin(sd*5.3),-cos(sd*4.1))*.003;',
    ' float k0=tinta(texture2D(C,u+o0).r,0.,u),k1=tinta(texture2D(C,u+o1).g,1.,u),k2=tinta(texture2D(C,u+o2).b,2.,u);',
    ' float kk=tinta(texture2D(K,u).r,3.,u);',
    /* tirar a peça: a impressão some em pontilhado, como a próxima camiseta entrando */
    ' float sai=smoothstep(' + (CICLO - .75).toFixed(2) + ',' + (CICLO - .08).toFixed(2) + ',f);',
    ' float fica=step(sai*1.08,fb(u*7.+sd)*.7+h(floor(u*180.))*.3);',
    ' vec3 c=vec3(1.);',
    ' c*=mix(vec3(1.),c0,k0*.96*fica);c*=mix(vec3(1.),c1,k1*.96*fica);c*=mix(vec3(1.),c2,k2*.96*fica);',
    ' c*=1.-kk*.9*fica;',
    /* sombra da lâmina do rodo durante cada passada */
    ' for(int j=0;j<4;j++){float i=float(j);float p=(f-' + INI + '-i*' + PASSO + ')/' + DUR + ';',
    '  if(p>0.&&p<1.){float fr=frente(i,u);float a=sin(p*3.1416);',
    '   c*=1.-.2*a*exp(-pow((u.y-fr-.005)/.004,2.))-.06*a*smoothstep(.0,.05,u.y-fr)*(1.-smoothstep(.05,.12,u.y-fr));}}',
    ' c-=(h(u*700.+f)-.5)*.014;',
    ' gl_FragColor=vec4(c,1.);}'
  ].join('\n');

  function iniciar(cv, base, opt) {
    opt = opt || {};
    var gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: !!opt.render });
    if (!gl) return Promise.reject('sem webgl');
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; }
    var pg = gl.createProgram();
    gl.attachShader(pg, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pg); gl.useProgram(pg);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pg, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['C', 'K', 'f', 'sd', 'c0', 'c1', 'c2'].forEach(function (k) { U[k] = gl.getUniformLocation(pg, k); });
    gl.uniform1i(U.C, 0); gl.uniform1i(U.K, 1);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    function carregar(src, fmt) {
      return new Promise(function (ok, erro) {
        var im = new Image(); im.decoding = 'async';
        im.onload = function () {
          var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texImage2D(gl.TEXTURE_2D, 0, fmt, fmt, gl.UNSIGNED_BYTE, im);
          [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR); });
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          ok(t);
        };
        im.onerror = erro; im.src = src;
      });
    }
    var tex = [];
    function quadro(t) {
      var r = cv.getBoundingClientRect(), dp = Math.min(window.devicePixelRatio || 1, 2);
      var w = opt.w || Math.round(r.width * dp), hh = opt.h || Math.round(r.height * dp);
      if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
      gl.viewport(0, 0, w, hh);
      var k = Math.floor(t / CICLO), f = t - k * CICLO, i = k % PECAS.length, P = PECAS[i];
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[i][0]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[i][1]);
      gl.uniform1f(U.f, f); gl.uniform1f(U.sd, i + 1);
      ['c0', 'c1', 'c2'].forEach(function (u, j) { var c = P.c[j]; gl.uniform3f(U[u], c[0] / 255, c[1] / 255, c[2] / 255); });
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (opt.onPeca) opt.onPeca(i, f);
    }
    return Promise.all(PECAS.map(function (p) {
      return Promise.all([carregar(base + p.n + '-c.webp', gl.RGB), carregar(base + p.n + '-k.webp', gl.LUMINANCE)]);
    })).then(function (t) { tex = t; return quadro; });
  }
  /* em que tela está (0..3) e se já passou: usado pelo rótulo */
  function tela(f) { return Math.max(-1, Math.min(3, Math.floor((f - INI) / PASSO))); }
  window.HeroSeri = { iniciar: iniciar, ciclo: CICLO, n: PECAS.length, pecas: PECAS, tela: tela, ini: INI, passo: PASSO, dur: DUR };
})();
