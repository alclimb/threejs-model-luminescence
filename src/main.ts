import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

/**
 * Three.js関連のユーティリティモジュール
 */
export module ThreeUtils {
  /**
   * GLTFファイルを読み込む
   */
  export function loadGltf(url: string, onProgress?: (event: ProgressEvent) => void): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(url, resolve, onProgress, reject);
    });
  }
}

const bloomParams = {
  /** トーンマッピング: 露光量 */
  exposure: 1.8,

  /** 発光エフェクト: 強さ */
  bloomStrength: 3.0,

  /** 発光エフェクト: 半径 */
  bloomRadius: 1.2,

  /** 発光エフェクト: 閾値 */
  bloomThreshold: 0.0,
};

async function main(element: HTMLElement) {
  // モデルをロード
  const model = await ThreeUtils.loadGltf(`/PrimaryIonDrive.glb`);

  // ライト(平行光)のセットアップ
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(7, 10, -2);
  directionalLight.color.set(0xffffff);
  directionalLight.castShadow = true; // ライトの影を有効
  directionalLight.intensity = 0.3;
  directionalLight.shadow.radius = 3.0;

  // ライト(環境光)のセットアップ
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);

  // 座標軸のセットアップ
  const axes = new THREE.AxesHelper(25);

  // シーンのセットアップ
  const scene = new THREE.Scene();
  scene.add(model.scene);
  scene.add(directionalLight);
  scene.add(ambientLight);
  scene.add(axes);

  // カメラのセットアップ
  const camera = new THREE.PerspectiveCamera(
    50,
    element.clientWidth / element.clientHeight,
    0.01,
    1000
  );
  camera.position.set(4, 2, 2);
  camera.lookAt(scene.position);

  // アニメーションミキサーのセットアップ
  const mixer = new THREE.AnimationMixer(model.scene);
  mixer.clipAction(model.animations[0].optimize()).play();

  // レンダラーのセットアップ
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(element.clientWidth, element.clientHeight);
  renderer.setClearColor(0x000000); // 背景色
  renderer.shadowMap.enabled = true; // レンダラー：シャドウを有効にする
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = Math.pow(bloomParams.exposure, 4.0);

  // エフェクト: 通常レンダリング
  const renderPass = new RenderPass(scene, camera);

  // エフェクト: 発光エフェクト
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(element.clientWidth, element.clientHeight),
    bloomParams.bloomStrength,
    bloomParams.bloomRadius,
    bloomParams.bloomThreshold,
  );

  // エフェクトのセットアップ
  const effectComposer = new EffectComposer(renderer);
  effectComposer.addPass(renderPass);
  effectComposer.addPass(bloomPass);
  effectComposer.setSize(element.clientWidth, element.clientHeight);

  // カメラコントローラーのセットアップ
  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.maxPolarAngle = Math.PI * 0.5;
  orbitControls.minDistance = 1;
  orbitControls.maxDistance = 100;
  orbitControls.autoRotate = false;    // カメラの自動回転設定
  orbitControls.autoRotateSpeed = 1.0; // カメラの自動回転速度

  // DOMに追加
  element.appendChild(renderer.domElement);

  // 最終更新時間
  let lastTime = 0;

  // リフレッシュレートに応じて呼び出しをリクエスト
  requestAnimationFrame(time => {
    // 最終更新時間を設定
    lastTime = time;

    // アニメーションを開始
    animate(time);
  });

  /**
   * フレーム描画処理
   */
  function animate(time: number) {
    // リフレッシュレートに応じて呼び出しをリクエスト
    requestAnimationFrame(time => animate(time));

    // 経過時間を算出
    const delta = (time - lastTime) / 1000;

    // アニメーションミキサーを更新
    mixer.update(delta);

    // カメラコントローラーを更新
    orbitControls.update();

    // シーンを描画する
    effectComposer.render(time);

    // 最終更新時間を設定
    lastTime = time;
  }
}

// DOMを取得
const appElement = document.querySelector<HTMLElement>(`#myApp`)!;

main(appElement);
