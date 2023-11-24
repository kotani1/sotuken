function updatePrjMatrix() {
  const trans = Matrix.translate(-_vv.x, -_vv.y), // ビューボリュームの左上隅を原点へ移動する
      invTrans = Matrix.translate(_vv.x, _vv.y),  // ビューボリュームの左上隅を原点へ移動する逆行列を求める
      scale = Matrix.scale(_vp.w / _vv.w, _vp.h / _vv.h), // ビューボリュームの拡大縮小し、ビューポートにフィットような行列を求める
      invScale = Matrix.scale(_vv.w / _vp.w, _vv.h / _vp.h);   // ビューボリュームの拡大縮小し、ビューポートにフィットような行列の逆行列を求める
  _m = Matrix.multiply(scale, trans); // 射影行列を更新する
  _inv = Matrix.multiply(invTrans, invScale); // 射影行列の逆行列を更新する
}
function anim() {
  if (_redrawFlag) {// 再描画する
      updateView();
      _redrawFlag = false;
  }
  requestAnimationFrame(anim);
}
// ビュー(canvas)更新
// ※本関数はanim関数で呼ばれる
function updateView() {
  const ctx = $('#canvas')[0].getContext('2d');

  ctx.save();

  // canvasをクリアする
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 射影行列をセットする(これによりワールド座標系からスクリーン座標系への射影が行われる)
  ctx.setTransform(_m[0], _m[3], _m[1], _m[4], _m[2], _m[5]);

  // 矩形、丸、三角形を適当な位置へ描画

  // 青色の矩形を描画
  ctx.fillStyle = 'blue';
  ctx.fillRect(400, 200, 100, 100);

  // 赤色の丸を描画
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(300, 600, 50, 0, 360 * Math.PI / 180, false);
  ctx.fill();

  // 緑色の三角形を描画
  ctx.fillStyle = 'green';
  ctx.beginPath();
  ctx.moveTo(800, 500);
  ctx.lineTo(750, 600);
  ctx.lineTo(850, 600);
  ctx.fill();

  ctx.restore();
}
// イベントハンドラ
$('#canvas').on('mousedown', e => {
  var cursorPos;  // スクリーン座標系のカーソルの座標

  // ブラウザのデフォルト動作を抑止(これをしないと、canvas上でのdragによる操作がうまく動作しない)
  e.preventDefault();

  if(_resizeTimeoutId !== -1) { return; } // リサイズ処理待ち

  if (_translating) {
      return;
  }
  _translating = true;

  // スクリーン座標系のカーソルの座標を取得
  cursorPos = { x: e.pageX, y: e.pageY };

  // スクリーン座標系をワールド座標系に変換
  _prePos = screenToWorld(cursorPos);
});

$('#canvas').on('mousemove', e => {
  let cursorPos,  // スクリーン座標系のカーソルの座標
      curPos;     // ワールド座標系のカーソルの座標

  if(!_translating) {
      return;
  }

  // スクリーン座標系のカーソルの座標を取得
  cursorPos = { x: e.pageX, y: e.pageY };

  // スクリーン座標系をワールド座標系に変換
  curPos = screenToWorld(cursorPos);

  // 平行移動する
  translate({ x: _prePos.x - curPos.x, y: _prePos.y - curPos.y });

  // カーソルの座標をワールド座標系へ変換
  _prePos = screenToWorld(cursorPos);

  // 再描画フラグを立てる
  _redrawFlag = true;
});

$('#canvas').on('mouseup', e => {
  _translating = false;
});

function translate(vec) {
  // ビューボリュームを更新する
  _vv.x += vec.x;
  _vv.y += vec.y;
  // 射影行列と射影行列の逆行列を更新する
  updatePrjMatrix();
}
$('#canvas').on('mousewheel', e => {

  let cursorPos,  // スクリーン座標系のカーソルの座標
      curPos,     // ワールド座標系のカーソルの座標
      rate;

  if(_resizeTimeoutId !== -1) { return; } // リサイズ処理待ち

  // スクリーン座標系のカーソルの座標を取得
  cursorPos = { x: e.pageX, y: e.pageY };

  // スクリーン座標系をワールド座標系に変換
  curPos = screenToWorld(cursorPos);

  if (e.originalEvent.wheelDelta > 0) {// 奥へ動かした -> 拡大する -> ビューボリュームを縮小する
      rate = 1 / 1.2;
  } else {// 手前へ動かした -> 縮小する -> ビューボリュームを拡大する
      rate = 1.2;
  }

  // 拡大縮小する
  scale(curPos, rate);

  // 再描画フラグを立てる
  _redrawFlag = true;
});

// 拡大縮小
function scale(center, rate) {
  let topLeft = { x: _vv.x, y: _vv.y },
      mat;

  // 中心座標を原点へ移動する
  mat = Matrix.translate(-center.x, -center.y);
  // 拡大縮小する
  mat = Matrix.multiply(Matrix.scale(rate, rate), mat);
  // 原点を中心座標へ戻す
  mat = Matrix.multiply(Matrix.translate(center.x, center.y), mat);

  topLeft = Matrix.multiply(mat, topLeft);

  // ビューボリューム更新
  _vv.x = topLeft.x;
  _vv.y = topLeft.y;
  _vv.w *= rate;
  _vv.h *= rate;

  // 射影行列と射影行列の逆行列を更新する
  updatePrjMatrix();
}

// リサイズ
// ビューボリュームの矩形の中心が変わらないように更新する
function resizeScaleCenter() {
  // 変更前の拡大率を求める
  const rate = { x: _vv.w / _vp.w, y: _vv.h / _vp.h };
  let vvsq = {};

  if(_vv.w > _vv.h) {// 横長
      vvsq.y = _vv.y;
      vvsq.size = _vv.h;
      vvsq.x = _vv.x + (_vv.w - vvsq.size) / 2;
  } else {// 縦長
      vvsq.x = _vv.x;
      vvsq.size = _vv.w;
      vvsq.y = _vv.y + (_vv.h - vvsq.size) / 2;
  }

  // ビューポートの更新
  updateViewport();

  // ビューボリュームの更新
  const aspect = _vp.w / _vp.h;
  if(aspect > 1) {// 横長
      _vv.y = vvsq.y;
      _vv.h = vvsq.size;
      _vv.x = vvsq.x - (vvsq.size * aspect) / 2 + vvsq.size / 2;
      _vv.w = vvsq.size * aspect;
  } else {// 縦長
      _vv.x = vvsq.x;
      _vv.w = vvsq.size;
      _vv.y = vvsq.y - (vvsq.size / aspect) / 2 + vvsq.size / 2;
      _vv.h = vvsq.size / aspect;
  }

  // 射影行列と射影行列の逆行列を更新する
  updatePrjMatrix();
}

// リサイズ
// ビューボリュームの矩形の左上隅が変わらないように更新する
function resizeScaleTopLeft() {
  // 変更前の拡大率を求める
  const rate = { x: _vv.w / _vp.w, y: _vv.h / _vp.h };
  let vvsq = {};

  if(_vv.w > _vv.h) {// 横長
      vvsq.size = _vv.h;
  } else {// 縦長
      vvsq.size = _vv.w;
  }

  // ビューポートの更新
  updateViewport();

  // ビューボリュームの更新
  const aspect = _vp.w / _vp.h;
  if(aspect > 1) {// 横長
      _vv.h = vvsq.size;
      _vv.w = vvsq.size * aspect;
  } else {// 縦長
      _vv.w = vvsq.size;
      _vv.h = vvsq.size / aspect;
  }

  // 射影行列と射影行列の逆行列を更新する
  updatePrjMatrix();
}

// リサイズ
// 矩形の中央を中心に何も変化がないように見せる
function resizeNoScaleCenter() {
  // 変更前の拡大率を求める
  const rate = { x: _vv.w / _vp.w, y: _vv.h / _vp.h };    // rate.xはrate.yと等しいんだけど、一応xもyも求めておく
  // 変更前のビューボリュームの中心点を求める
  const oldCenter = {
      x: _vv.x + _vv.w / 2,
      y: _vv.y + _vv.h / 2
  };
  // ビューポートの更新
  updateViewport();

  // ビューボリュームの更新(幅と高さのみ更新する)
  _vv.w = _vp.w * rate.x;
  _vv.h = _vp.h * rate.y;
  _vv.x = oldCenter.x - _vv.w / 2;
  _vv.y = oldCenter.y - _vv.h / 2;

  // 射影行列と射影行列の逆行列を更新する
  updatePrjMatrix();
}

// リサイズ
// 矩形の左上隅を中心に何も変化がないように見せる
function resizeNoScaleTopLeft() {
  // 変更前の拡大率を求める
  const rate = { x: _vv.w / _vp.w, y: _vv.h / _vp.h };    // rate.xはrate.yと等しいんだけど、一応xもyも求めておく

  // ビューポートの更新
  updateViewport();

  // ビューボリュームの更新(幅と高さのみ更新する)
  _vv.w = _vp.w * rate.x;
  _vv.h = _vp.h * rate.y;

  // 射影行列と射影行列の逆行列を更新する
  updatePrjMatrix();
}

$(window).on('resize', e => {
  // リサイズイベント毎に処理しないように少し時間をおいて処理する
  if(_resizeTimeoutId !== -1) {
      clearTimeout(_resizeTimeoutId);
      _resizeTimeoutId = -1;
  }
  _resizeTimeoutId = setTimeout(() => {
      if(_resizeType === 'scale center') {
          resizeScaleCenter();
      } else if(_resizeType === 'scale top left') {
          resizeScaleTopLeft();
      } else if(_resizeType === 'no scale center') {
          resizeNoScaleCenter();
      } else if(_resizeType === 'no scale top left') {
          resizeNoScaleTopLeft();
      }
      updateDom();
      _redrawFlag = true;
      _resizeTimeoutId = -1;
  }, 500);
});

