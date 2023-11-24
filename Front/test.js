class Matrix {
  // m0は行列、m1は行列又はベクトル
  // 行列は大きさ9の1次元配列であること。 ex. [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]
  // ベクトルはxとyをプロパティに持つ連想配列であること。 ex. { x: 2, y: 4 }
  // 左からベクトルをかけることは想定していない
  static multiply(m0, m1) {
      if(m1.length && m1.length === 9) {// m1は行列
          return [
              m0[0] * m1[0] + m0[1] * m1[3] + m0[2] * m1[6],
              m0[0] * m1[1] + m0[1] * m1[4] + m0[2] * m1[7],
              m0[0] * m1[2] + m0[1] * m1[5] + m0[2] * m1[8],
              m0[3] * m1[0] + m0[4] * m1[3] + m0[5] * m1[6],
              m0[3] * m1[1] + m0[4] * m1[4] + m0[5] * m1[7],
              m0[3] * m1[2] + m0[4] * m1[5] + m0[5] * m1[8],
              m0[6] * m1[0] + m0[7] * m1[3] + m0[8] * m1[6],
              m0[6] * m1[1] + m0[7] * m1[4] + m0[8] * m1[7],
              m0[6] * m1[2] + m0[7] * m1[5] + m0[8] * m1[8],
          ];
      } else {// m1はベクトル
          return {
              x: m0[0] * m1.x + m0[1] * m1.y + m0[2],
              y: m0[3] * m1.x + m0[4] * m1.y + m0[5],
          };
      }
  }
  static translate(x, y) {
      return [1, 0, x, 0, 1, y, 0, 0, 1];
  }
  static scale(x, y) {
      return [x, 0, 0, 0, y, 0, 0, 0, 1];
  }
}
$(() => {
  console.log('実行開始')
  let _translating,   // 平行移動中かどうかのフラグ
      _prePos,        // 平行移動時の1つ前の座標
      _redrawFlag,    // 再描画フラグ
      _m,             // 射影行列
      _inv,           // 射影行列の逆行列
      _vv,            // ビューボリューム(表示範囲)
      _vp,            // ビューポート(canvasの矩形)
      _resizeTimeoutId,   // windowリサイズ時に使用するタイマーのID
      _resizeType;        // windowリサイズ時のビューボリューム更新メソッドの種類

  initModel();        // モデルの初期化
  updateDom();        // ビュー(DOM)の初期化
  initController();   // コントローラの初期化
  anim();             // ビュー(canvas)の更新は、ここで行う

  // モデルの初期化
  function initModel() {
    console.log('initmodel関数開始')
      _translating = false;   // 平行移動中かどうかのフラグ
      _redrawFlag = true;     // 再描画フラグ(初回描画の為trueにしておく)
      _resizeTimeoutId = -1;  // windowリサイズ時に使用するタイマーのID
      _resizeType = 'no scale top left'; // windowリサイズ時のビューボリューム更新メソッドの種類

      // ビューポートとビューボリュームを初期化する
      updateViewport();
      _vv = { x: 0, y: 0, w: _vp.w, h: _vp.h };
      // 射影行列と射影行列の逆行列を更新する
      updatePrjMatrix();
  }

  // コントローラの初期化
  function initController() {
    console.log('initController関数開始')
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

          // 再描画フラグを立てる
          _redrawFlag = true;
      });

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

      // $('#resize-select').change(e => {
      //     _resizeType = $(e.target).val();
      // });
  }

  // 滑らかに描画できるようにrequestAnimationFrameのタイミングで必要に応じて再描画する
  function anim() {
      if (_redrawFlag) {// 再描画する
          updateView();
          _redrawFlag = false;
      }
      requestAnimationFrame(anim);
  }

  // ビューポートの更新
  function updateViewport() {
      _vp = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
  }

  // 射影行列をビューポートとビューボリュームから計算する
  function updatePrjMatrix() {
      const trans = Matrix.translate(-_vv.x, -_vv.y), // ビューボリュームの左上隅を原点へ移動する
          invTrans = Matrix.translate(_vv.x, _vv.y),  // ビューボリュームの左上隅を原点へ移動する逆行列を求める
          scale = Matrix.scale(_vp.w / _vv.w, _vp.h / _vv.h), // ビューボリュームの拡大縮小し、ビューポートにフィットような行列を求める
          invScale = Matrix.scale(_vv.w / _vp.w, _vv.h / _vp.h);   // ビューボリュームの拡大縮小し、ビューポートにフィットような行列の逆行列を求める
      _m = Matrix.multiply(scale, trans); // 射影行列を更新する
      _inv = Matrix.multiply(invTrans, invScale); // 射影行列の逆行列を更新する
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

  // 平行移動
  function translate(vec) {
      // ビューボリュームを更新する
      _vv.x += vec.x;
      _vv.y += vec.y;
      // 射影行列と射影行列の逆行列を更新する
      updatePrjMatrix();
  }

  // スクリーン座標をワールド座標へ変換する
  function screenToWorld(screenPos) {
      return Matrix.multiply(_inv, screenPos);
  }

  // ビュー(DOM)の更新
  function updateDom() {
    console.log('updateDomm関数開始')
      // canvasをリサイズ
      $('#canvas').prop({
          width: _vp.w,
          height: _vp.h
      });

      // リサイズタイプの設定(初期化時のみ)
      // $('#resize-select').val(_resizeType);
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


      //楕円を描く
      // 中心のx座標, 中心のy座標, x方向の半径, y方向の半径,傾き, 開始角度, 終了角度, [回転方向]
      ctx.beginPath();
      ctx.ellipse(600, 300, 100, 50, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = "23px serif";
      ctx.fillText("香川県　水不足", 520,310);
      ctx.beginPath();
      ctx.ellipse(200, 300, 100, 50, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = "23px serif";
      ctx.fillText("早明浦ダム", 120,310);
      ctx.beginPath();
      ctx.moveTo(500,300);
      ctx.lineTo(300, 300);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(1000, 300, 100, 50, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = "23px serif";
      ctx.fillText("香川用水", 920,310);
      ctx.beginPath();
      ctx.moveTo(700,300);
      ctx.lineTo(900, 300);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(600, 0, 100, 50, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = "23px serif";
      ctx.fillText("吉野川", 520,10);
      ctx.beginPath();
      ctx.moveTo(600,250);
      ctx.lineTo(600, 50);
      ctx.stroke();
      ctx.restore();
  }
});
