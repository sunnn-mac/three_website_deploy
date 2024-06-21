import "./style.css";
import * as THREE from "three";
// OrbitControlesをnpm installする必要はないが、importは分ける必要あり
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";

//canvas
const canvas = document.querySelector("#webgl");

//シーン
const scene = new THREE.Scene();

//背景用のテクスチャ
const textureLoader = new THREE.TextureLoader();
const bgTexture = textureLoader.load("bg.jpg");
scene.background = bgTexture;

//サイズ
const sizes = {
  width: innerWidth,
  height: innerHeight,
};

//カメラ
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);

//レンダラー
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio); //解像度の粗さが軽減される

//テスト用に追加 今回動作せず
  //マウス操作ができるように（カメラがターゲットの周りを周回できるように）
  // ドラッグでカメラの位置を変更。スクロールでカメラを遠くに、近くに
// const controls = new OrbitControls(camera, renderer.domElement);

/**
 * オブジェクトを作成
 */
//ボックス
const boxGeometory = new THREE.BoxGeometry(5, 5, 5, 10);
const boxMaterial = new THREE.MeshNormalMaterial();
const box = new THREE.Mesh(boxGeometory, boxMaterial);
box.position.set(0, 0.5, -15);
box.rotation.set(1, 0.3, 0); //少し回転

//ドーナツ
const torusGeometry = new THREE.TorusGeometry(8, 2, 16, 100);
const torusMaterial = new THREE.MeshNormalMaterial();
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
torus.position.set(0, 1, 10);

// テスト用 座標軸を表示
// x 軸は赤
// y 軸は緑
// z 軸は青
var axes = new THREE.AxesHelper(25);
// scene.add(axes);

scene.add(box, torus);

/**
 * 線形補完で滑らかに移動させる
 */
//線形補完関数 x:スタート位置 y:到着位置 a:式（0->1に変動する値を出力）
function lerp(x, y, a){
  return (1 - a) * x + a * y;
}
// 線形補完のa用の式を定義　ここでは一次関数
// 一つのアニメーションで定義したスクロール率の中での、
// 今のスクロール率の割合
// 例）start:0% end:40% scrollPercent: 20%  -> return 0.5(つまり五割)
function scalePercent(start, end){
  return (scrollPercent - start) / (end - start);
}

/**
 * アニメーション
 * スクロールのa%,b%,c%。。。z% (a+b+c+。。。+z=100%)のとき、
 * 動作するアニメーション動作を配列に入れておく
 */
//スクロールアニメーション
const animationScript = [];
//boxは近づく、ドーナツは手前から奥へ移動
animationScript.push({
  start: 0, //%
  end: 40, //%
  function() {
    //実行関数
    camera.lookAt(box.position); //カメラはboxを向いている
    camera.position.set(0, 1, 10); //結構手前に位置している
    // box.position.z += 0.01; //だんだん手前に寄ってくる。これだと無限に手前に来るのでだめ
    // 線形補完を使って、zを-15 -> 2に滑らかに移動させる 
    box.position.z = lerp(-15, 2, scalePercent(0, 40));
    torus.position.z = lerp(10, -20, scalePercent(0, 40));
  },
});
//boxが回転
animationScript.push({
  start: 40, //%
  end: 60, //%
  function() {
    //実行関数
    camera.lookAt(box.position); //カメラはboxを向いている
    camera.position.set(0, 1, 10); //結構手前に位置している
    //反時計回りにz軸を中心に回転
    box.rotation.z = lerp(1, Math.PI, scalePercent(40, 60));
    console.log(box.rotation.z);
  },
});

//カメラの位置を変更
animationScript.push({
  start: 60, //%
  end: 80, //%
  function() {
    //実行関数
    camera.lookAt(box.position); //カメラはboxを向いている
    camera.position.x = lerp(0, -15, scalePercent(60, 80)); 
    camera.position.y = lerp(1, 15, scalePercent(60, 80)); 
    camera.position.z = lerp(10, 25, scalePercent(60, 80)); 
  },
});

//カメラの位置を変更
animationScript.push({
  start: 80, //%
  end: 100, //%
  function() {
    //実行関数
    camera.lookAt(box.position); //カメラはboxを向いている
    box.rotation.x += 0.02;
    box.rotation.y += 0.02;
  },
});

function playSclollAnimation() {
  animationScript.forEach((animation) => {
    //条件に合うときだけ、アニメーションを実行
    if(scrollPercent >= animation.start && scrollPercent <= animation.end)
      animation.function();
  });
}

//ブラウザのスクロール率を取得
let scrollPercent = 0;
// 前、addEventListenerでホイールを取得したけど、それとはどう違う？
document.body.onscroll = () => {
  scrollPercent =
    // スクロール率 = x / (l - y)
    //  l = 全体にスクロール可能な長さ scrollHeight
    //  x =  現在どこまでスクロールされているか scrollTop
    //  y = 現在表示されている画面の高さ clientHeight
    (document.documentElement.scrollTop /
    (document.documentElement.scrollHeight -
      document.documentElement.clientHeight)) * 100;
      // console.log(scrollPercent);
};

//アニメーション
const tick = () => {
  //OrbitControl用
  // controls.update();

  window.requestAnimationFrame(tick);
  playSclollAnimation();
  renderer.render(scene, camera);
};

tick();

//ブラウザのリサイズ操作
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix(); //アスペクト比の反映

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);
});
