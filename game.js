
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// ESTADO DO JOGO
const statusElement = document.getElementById("status");
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("startButton");
const crosshair = document.getElementById("crosshair");
const messageElement = document.getElementById("message");

let vida = 100;
let municao = 12;
let reserva = 60;
let eliminados = 0;
let fase = 1;
let jogando = false;
let recarregando = false;
let proximoAtaque = 0;
let proximoSpawn = 0;
let mensagemAte = 0;

const teclas = {};
const monstros = [];
const obstaculos = [];

const cena = new THREE.Scene();
cena.background = new THREE.Color(0x101d19);
cena.fog = new THREE.FogExp2(0x101d19, 0.018);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  180
);

camera.position.set(0, 1.7, 8);
camera.rotation.order = "YXZ";
cena.add(camera);

const renderizador = new THREE.WebGLRenderer({
  antialias: true
});

renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.shadowMap.enabled = true;
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
renderizador.outputColorSpace = THREE.SRGBColorSpace;

document.body.insertBefore(renderizador.domElement, overlay);

// ILUMINAÇÃO
cena.add(new THREE.HemisphereLight(0xb8d5ff, 0x24351c, 2));

const lua = new THREE.DirectionalLight(0xd9e7ff, 2);
lua.position.set(-12, 22, 8);
lua.castShadow = true;
cena.add(lua);

// CHÃO
const terreno = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  new THREE.MeshStandardMaterial({
    color: 0x263b25,
    roughness: 1
  })
);

terreno.rotation.x = -Math.PI / 2;
terreno.position.y = 0;
terreno.receiveShadow = true;
cena.add(terreno);

// ELEMENTOS DO CENÁRIO
function criarArvore(x, z) {
  const altura = 3 + Math.random() * 3;

  const tronco = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.38, altura, 7),
    new THREE.MeshStandardMaterial({ color: 0x493326 })
  );

  tronco.position.set(x, altura / 2, z);
  tronco.castShadow = true;
  cena.add(tronco);

  const copa = new THREE.Mesh(
    new THREE.ConeGeometry(1.5 + Math.random(), 3.5, 7),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(
        0.28 + Math.random() * 0.08,
        0.45,
        0.13 + Math.random() * 0.1
      )
    })
  );

  copa.position.set(x, altura + 1, z);
  copa.castShadow = true;
  cena.add(copa);

  obstaculos.push({
    x,
    z,
    raio: 0.7
  });
}

for (let i = 0; i < 100; i++) {
  const x = (Math.random() - 0.5) * 100;
  const z = (Math.random() - 0.5) * 100;

  if (Math.hypot(x, z - 8) > 8) {
    criarArvore(x, z);
  }
}

// PEDRAS
for (let i = 0; i < 30; i++) {
  const x = (Math.random() - 0.5) * 90;
  const z = (Math.random() - 0.5) * 90;

  const pedra = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.5 + Math.random(), 0),
    new THREE.MeshStandardMaterial({
      color: 0x51584d,
      roughness: 1
    })
  );

  pedra.position.set(x, 0.4, z);
  pedra.scale.y = 0.65;
  pedra.castShadow = true;
  cena.add(pedra);

  obstaculos.push({
    x,
    z,
    raio: 0.8
  });
}

// ARMA VISÍVEL
const arma = new THREE.Group();
camera.add(arma);
arma.position.set(0.38, -0.32, -0.65);

const cano = new THREE.Mesh(
  new THREE.BoxGeometry(0.13, 0.13, 0.85),
  new THREE.MeshStandardMaterial({
    color: 0x252a2c,
    metalness: 0.8,
    roughness: 0.3
  })
);
cano.position.z = -0.28;
arma.add(cano);

const coronha = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 0.22, 0.35),
  new THREE.MeshStandardMaterial({ color: 0x684329 })
);
coronha.position.set(0, -0.1, 0.16);
arma.add(coronha);

const cabo = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.3, 0.14),
  new THREE.MeshStandardMaterial({ color: 0x282828 })
);
cabo.position.set(0, -0.2, -0.02);
arma.add(cabo);

// CRIAR MONSTROS
function criarMonstro() {
  const angulo = Math.random() * Math.PI * 2;
  const distancia = 16 + Math.random() * 12;
  const x = camera.position.x + Math.sin(angulo) * distancia;
  const z = camera.position.z - Math.cos(angulo) * distancia;

  const grupo = new THREE.Group();

  const cor = new THREE.Color().setHSL(
    0.32 + Math.random() * 0.12,
    0.7,
    0.25
  );

  const pele = new THREE.MeshStandardMaterial({
    color: cor,
    roughness: 0.9
  });

  const corpo = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.25, 0.55),
    pele
  );
  corpo.position.y = 1.15;
  corpo.castShadow = true;
  grupo.add(corpo);

  const cabeca = new THREE.Mesh(
    new THREE.SphereGeometry(0.43, 12, 10),
    pele
  );
  cabeca.position.y = 2.05;
  cabeca.castShadow = true;
  grupo.add(cabeca);

  const olhoMaterial = new THREE.MeshBasicMaterial({
    color: 0xff2020
  });

  for (const lado of [-1, 1]) {
    const olho = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 8, 8),
      olhoMaterial
    );
    olho.position.set(lado * 0.17, 2.1, -0.36);
    grupo.add(olho);
  }

  for (const lado of [-1, 1]) {
    const perna = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.7, 0.3),
      pele
    );
    perna.position.set(lado * 0.25, 0.4, 0);
    grupo.add(perna);
  }

  grupo.position.set(x, 0, z);
  cena.add(grupo);

  monstros.push({
    grupo,
    vida: 2 + Math.floor(fase / 3),
    velocidade: 1.1 + fase * 0.12,
    ataque: 0,
    vivo: true
  });
}

// HUD
function atualizarHUD() {
  document.getElementById("health").textContent = vida;
  document.getElementById("healthBar").style.width =
    Math.max(0, vida) + "%";

  document.getElementById("ammo").textContent =
    `${municao} / ${reserva}`;

  document.getElementById("kills").textContent = eliminados;
  document.getElementById("level").textContent = fase;

  document.getElementById("healthBar").style.background =
    vida <= 30 ? "#ff3535" : "#54e36d";
}

function mostrarMensagem(texto, duracao = 1800) {
  messageElement.textContent = texto;
  mensagemAte = performance.now() + duracao;
}

function terminarJogo(vitoria = false) {
  jogando = false;
  document.exitPointerLock?.();
  overlay.style.display = "flex";
  crosshair.style.display = "none";

  document.querySelector(".eyebrow").textContent =
    vitoria ? "MISSÃO CUMPRIDA" : "FIM DE JOGO";

  document.querySelector("h1").innerHTML = vitoria
    ? "VOCÊ É O<br><span>GRANDE CAÇADOR</span>"
    : "VOCÊ FOI<br><span>DERROTADO</span>";

  document.getElementById("description").textContent =
    `Monstros eliminados: ${eliminados}. Fase alcançada: ${fase}.`;

  startButton.textContent = "JOGAR NOVAMENTE";
  statusElement.textContent = "Clique para iniciar uma nova caçada.";
}

// INICIAR OU REINICIAR
function iniciarJogo() {
  vida = 100;
  municao = 12;
  reserva = 60;
  eliminados = 0;
  fase = 1;
  recarregando = false;
  jogando = true;

  for (const monstro of monstros) {
    cena.remove(monstro.grupo);
  }
  monstros.length = 0;

  camera.position.set(0, 1.7, 8);
  camera.rotation.set(0, 0, 0);

  overlay.style.display = "none";
  crosshair.style.display = "block";
  atualizarHUD();
  criarMonstro();
  criarMonstro();

  rendererFocus();
}

function rendererFocus() {
  renderizador.domElement.requestPointerLock?.();
}

// CONTROLES
startButton.addEventListener("click", iniciarJogo);

document.addEventListener("keydown", (event) => {
  teclas[event.code] = true;

  if (event.code === "KeyR") {
    recarregar();
  }

  if (event.code === "Escape") {
    // O navegador libera o mouse ao pressionar ESC.
  }
});

document.addEventListener("keyup", (event) => {
  teclas[event.code] = false;
});

document.addEventListener("mousemove", (event) => {
  if (!jogando || document.pointerLockElement !== renderizador.domElement) {
    return;
  }

  camera.rotation.y -= event.movementX * 0.002;
  camera.rotation.x -= event.movementY * 0.002;

  camera.rotation.x = THREE.MathUtils.clamp(
    camera.rotation.x,
    -1.45,
    1.45
  );
});

document.addEventListener("mousedown", (event) => {
  if (!jogando || event.button !== 0) return;

  if (document.pointerLockElement !== renderizador.domElement) {
    rendererFocus();
    return;
  }

  atirar();
});

// DISPARO
const raycaster = new THREE.Raycaster();

function atirar() {
  if (performance.now() < proximoAtaque || recarregando) return;

  if (municao <= 0) {
    mostrarMensagem("Sem munição! Pressione R.");
    return;
  }

  municao--;
  proximoAtaque = performance.now() + 350;

  arma.position.z = -0.45;
  setTimeout(() => {
    arma.position.z = -0.65;
  }, 80);

  const direcao = new THREE.Vector3();
  camera.getWorldDirection(direcao);
  raycaster.set(camera.position, direcao);

  const alvos = [];

  for (const monstro of monstros) {
    if (monstro.vivo) {
      monstro.grupo.traverse((objeto) => {
        if (objeto.isMesh) alvos.push(objeto);
      });
    }
  }

  const acertos = raycaster.intersectObjects(alvos, false);

  if (acertos.length > 0) {
    let objeto = acertos[0].object;
    let encontrado = null;

    for (const monstro of monstros) {
      if (monstro.grupo.getObjectById(objeto.id)) {
        encontrado = monstro;
        break;
      }
    }

    if (encontrado && encontrado.vivo) {
      encontrado.vida--;

      if (encontrado.vida <= 0) {
        encontrado.vivo = false;
        cena.remove(encontrado.grupo);
        eliminados++;

        mostrarMensagem("MONSTRO ELIMINADO!");

        if (eliminados % 5 === 0) {
          fase++;
          reserva += 12;
          mostrarMensagem(`FASE ${fase}! Mais monstros se aproximam!`, 2500);
        }
      } else {
        mostrarMensagem("ACERTOU!");
      }
    }
  }

  atualizarHUD();
}

// RECARREGAR
function recarregar() {
  if (recarregando || municao === 12 || reserva <= 0 || !jogando) {
    return;
  }

  recarregando = true;
  mostrarMensagem("Recarregando...");

  setTimeout(() => {
    const necessario = 12 - municao;
    const transferido = Math.min(necessario, reserva);

    municao += transferido;
    reserva -= transferido;
    recarregando = false;
    atualizarHUD();
  }, 1200);
}

// MOVIMENTO E COLISÃO
function moverJogador(delta) {
  if (!jogando) return;

  const frente = new THREE.Vector3();
  camera.getWorldDirection(frente);
  frente.y = 0;
  frente.normalize();

  const direita = new THREE.Vector3()
    .crossVectors(frente, camera.up)
    .normalize();

  const movimento = new THREE.Vector3();

  if (teclas.KeyW || teclas.ArrowUp) movimento.add(frente);
  if (teclas.KeyS || teclas.ArrowDown) movimento.sub(frente);
  if (teclas.KeyD || teclas.ArrowRight) movimento.sub(direita);
  if (teclas.KeyA || teclas.ArrowLeft) movimento.add(direita);

  if (movimento.lengthSq() > 0) {
    movimento.normalize().multiplyScalar(5 * delta);

    const novoX = camera.position.x + movimento.x;
    const novoZ = camera.position.z + movimento.z;

    let bloqueadoX = false;
    let bloqueadoZ = false;

    for (const obstaculo of obstaculos) {
      if (
        Math.hypot(novoX - obstaculo.x, camera.position.z - obstaculo.z)
        < obstaculo.raio + 0.35
      ) {
        bloqueadoX = true;
      }

      if (
        Math.hypot(camera.position.x - obstaculo.x, novoZ - obstaculo.z)
        < obstaculo.raio + 0.35
      ) {
        bloqueadoZ = true;
      }
    }

    if (!bloqueadoX) camera.position.x = novoX;
    if (!bloqueadoZ) camera.position.z = novoZ;
  }

  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -90, 90);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -90, 90);
  camera.position.y = 1.7;
}

// ATUALIZAR MONSTROS
function atualizarMonstros(delta, tempo) {
  if (!jogando) return;

  for (const monstro of monstros) {
    if (!monstro.vivo) continue;

    const grupo = monstro.grupo;

    const dx = camera.position.x - grupo.position.x;
    const dz = camera.position.z - grupo.position.z;
    const distancia = Math.hypot(dx, dz);

    grupo.rotation.y = Math.atan2(dx, dz);

    if (distancia > 1.6) {
      grupo.position.x += (dx / distancia) * monstro.velocidade * delta;
      grupo.position.z += (dz / distancia) * monstro.velocidade * delta;
    } else if (tempo > monstro.ataque) {
      vida = Math.max(0, vida - 8);
      monstro.ataque = tempo + 1.2;
      atualizarHUD();
      mostrarMensagem("O MONSTRO ESTÁ ATACANDO!");

      if (vida <= 0) terminarJogo(false);
    }
  }

  if (tempo > proximoSpawn && monstros.filter(m => m.vivo).length < 3 + fase) {
    criarMonstro();
    proximoSpawn = tempo + Math.max(1.5, 5 - fase * 0.3);
  }

  if (eliminados >= 20) {
    terminarJogo(true);
  }
}

// LOOP PRINCIPAL
let ultimoTempo = 0;

function animar(tempoMs) {
  requestAnimationFrame(animar);

  const tempo = tempoMs / 1000;
  const delta = Math.min(tempo - ultimoTempo, 0.05);
  ultimoTempo = tempo;

  if (jogando) {
    moverJogador(delta);
    atualizarMonstros(delta, tempo);
  }

  if (performance.now() > mensagemAte) {
    messageElement.textContent = "";
  }

  renderizador.render(cena, camera);
}

// REDIMENSIONAR TELA
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderizador.setSize(window.innerWidth, window.innerHeight);
});

// MOSTRAR ERROS NA TELA
window.addEventListener("error", (event) => {
  statusElement.textContent = "Erro: " + event.message;
});

window.addEventListener("unhandledrejection", (event) => {
  statusElement.textContent =
    "Erro ao carregar o jogo: " + event.reason;
});

statusElement.textContent = "Jogo carregado. Clique em iniciar.";
atualizarHUD();
animar(0);
