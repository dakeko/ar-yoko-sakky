(function () {
  const cfg = window.AR_CONFIG || {};
  const videoSrc  = cfg.video      || 'assets/videos/main.mp4';
  const targetSrc = cfg.target     || 'assets/targets.mind';
  const w         = cfg.width      || 1;
  const h         = cfg.height     || 1.8;
  const scale     = cfg.scale      || '2 2 2';
  const introHtml = cfg.intro      || '';
  const msgHtml   = cfg.message    || 'カメラを準備しています…<br>準備ができたら画像をかざしてください';
  const soundText = cfg.soundLabel || '🔊 タップして声を聞く';
  const links     = cfg.links      || [];
  const arTexts   = cfg.arTexts    || [];
  const showDebug = cfg.debug === true;

  document.body.insertAdjacentHTML('afterbegin', `
    <div id="loading">
      <div class="intro">${introHtml}</div>
      <div class="msg">${msgHtml}</div>
    </div>
    <button id="sound-button">${soundText}</button>
    <div id="link-buttons">
      ${links.map(l =>
        `<img src="${l.icon}" onclick="window.open('${l.url}','_blank')">`
      ).join('')}
    </div>
    <div id="debug" class="${showDebug ? '' : 'off'}">init</div>

    <a-scene mindar-image="imageTargetSrc: ${targetSrc};"
             color-space="sRGB"
             renderer="colorManagement:true"
             vr-mode-ui="enabled:false"
             device-orientation-permission-ui="enabled:false">
      <a-assets timeout="3000">
        <video id="video" src="${videoSrc}"
               preload="auto" muted loop playsinline webkit-playsinline></video>
      </a-assets>
      <a-camera position="0 0 0" look-controls="enabled:false"></a-camera>
      <a-entity mindar-image-target="targetIndex:0" id="card-target" scale="${scale}">
        <a-video id="ar-video" src="#video"
                 width="${w}" height="${h}" position="0 0 0.001"></a-video>
        ${arTexts.map(t => `
          <a-text value="${t.value}"
                  position="${t.position || '0 0 0.002'}"
                  align="${t.align || 'center'}"
                  color="${t.color || '#FFFFFF'}"
                  width="${t.width || 1.8}"></a-text>
        `).join('')}
      </a-entity>
    </a-scene>
  `);

  const sceneEl  = document.querySelector('a-scene');
  const target   = document.querySelector('#card-target');
  const video    = document.querySelector('#video');
  const linkBox  = document.querySelector('#link-buttons');
  const soundBtn = document.querySelector('#sound-button');
  const loading  = document.querySelector('#loading');
  const dbg      = document.querySelector('#debug');

  const log = (m) => { dbg.textContent = m; console.log('[AR]', m); };

  sceneEl.addEventListener('arReady', () => {
    loading.classList.add('hide');
    setTimeout(() => { loading.style.display = 'none'; }, 400);
    log('arReady / readyState=' + video.readyState);
  });

  sceneEl.addEventListener('arError', () => {
    loading.querySelector('.msg').innerHTML =
      'カメラを起動できませんでした。<br>カメラの使用を許可して、<br>ページを再読み込みしてください。';
    log('arError');
  });

  let lostTimer = null;
  let awayConfirmed = true;

  target.addEventListener('targetFound', () => {
    clearTimeout(lostTimer);
    if (links.length) linkBox.style.display = 'flex';
    if (video.muted) soundBtn.style.display = 'block';

    if (awayConfirmed) {
      video.currentTime = 0;
      awayConfirmed = false;
    }

    video.play()
      .then(() => log('play OK / muted=' + video.muted))
      .catch(e  => log('play NG: ' + e.name));
  });

  target.addEventListener('targetLost', () => {
    clearTimeout(lostTimer);
    lostTimer = setTimeout(() => {
      video.pause();
      awayConfirmed = true;
      linkBox.style.display = 'none';
      soundBtn.style.display = 'none';
      log('targetLost 確定');
    }, 1000);
  });

  soundBtn.addEventListener('click', () => {
    video.muted = false;
    video.currentTime = 0;
    video.play();
    soundBtn.style.display = 'none';
    log('音オン / 頭から再生');
  });

  ['loadedmetadata','canplay','waiting','stalled','error']
    .forEach(ev => video.addEventListener(ev,
      () => log('video:' + ev + ' rs=' + video.readyState)));
})();
