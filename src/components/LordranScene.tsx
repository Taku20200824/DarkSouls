/** Original scenery drawn for this companion; no external game artwork. */
export function LordranScene() {
  return (
    <div className="lordran-scene" aria-hidden="true">
      <div className="eclipse-halo" /><div className="eclipse-ring"><span /></div><div className="scene-stars" />
      <svg className="citadel-scene" viewBox="0 0 900 900" fill="none" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="scene-stone" x1="450" y1="220" x2="450" y2="900" gradientUnits="userSpaceOnUse"><stop stopColor="#373b39" /><stop offset="1" stopColor="#080b0b" /></linearGradient>
          <linearGradient id="scene-front" x1="450" y1="400" x2="450" y2="900" gradientUnits="userSpaceOnUse"><stop stopColor="#222724" /><stop offset="1" stopColor="#080a09" /></linearGradient>
          <linearGradient id="scene-sword"><stop stopColor="#c6c8b9" /><stop offset="0.5" stopColor="#78827a" /><stop offset="1" stopColor="#e8b574" /></linearGradient>
          <linearGradient id="scene-fire" x1="450" y1="754" x2="450" y2="601" gradientUnits="userSpaceOnUse"><stop stopColor="#c84c17" /><stop offset="0.55" stopColor="#ff9b46" /><stop offset="1" stopColor="#ffe7b4" /></linearGradient>
          <radialGradient id="scene-ground"><stop stopColor="#ce6529" stopOpacity=".38" /><stop offset="1" stopColor="#ce6529" stopOpacity="0" /></radialGradient>
        </defs>
        <g fill="url(#scene-stone)" stroke="#59605b" strokeOpacity=".25">
          <path d="M40 700V550h30V410l12-64 12 64v110h38V470h45V345l18-65 18 65v125h36V370h30V260l13-78 13 78v110h38V300h24V198l20-99 20 99v102h25V365h39V245l16-78 16 78v120h32V290h26V195l17-87 17 87v95h28V390h44V340l16-70 16 70v120h38V400l13-55 13 55v150h38v150Z" />
          <path d="M0 605h245v35H0zm625-70h275v30H625" /><path d="M80 640v90m55-90v90m55-90v90m500-165v140m60-140v140m60-140v140" strokeWidth="15" />
        </g>
        <g stroke="#cfaf76" strokeOpacity=".22" strokeWidth="3"><path d="M188 367v52m14-52v52m81-118v45m13-45v45m63-118v50m17-50v50m93 27v42m14-42v42m79-82v52m14-52v52m88 116v44" /></g>
        <path d="M100 900V740l98-65V560h52V456l22-58 22 58v104h55V465l24-76 24 76v95h107V438l25-78 25 78v122h55V485l22-68 22 68v130h51l97 285Z" fill="url(#scene-front)" stroke="#687063" strokeOpacity=".25" />
        <g stroke="#6e7566" strokeOpacity=".23"><path d="M219 570h390M210 595h412M197 625h440M180 660h478M150 702h540M250 560v125m45-125v130m57-130v140m186-140v140m51-140v160" /><path d="M407 660V553q42-72 84 0v107M418 650v-91q31-53 62 0v91" /></g>
        <path d="M0 900v-91l145-82 135 15 127-44 111 7 112 40 124-22 146 86v91Z" fill="#0a0d0c" />
        <ellipse cx="450" cy="770" rx="220" ry="105" fill="url(#scene-ground)" />
        <g stroke="#706c57" strokeOpacity=".22"><path d="m280 900 142-153h66l160 153M317 859h288M347 826h224M374 799h170M394 777h126M410 760h94m-39 140-12-153m-60 153 49-153m95 153-73-153" /></g>
        <g className="scene-flame"><path d="M450 754c-68-6-67-52-42-91-4 31 18 27 14 6-5-25 16-38 24-68-1 36 33 43 27 76 17-6 19-22 18-30 34 53 16 105-41 107Z" fill="url(#scene-fire)" opacity=".85" /><path d="M450 749c-29-9-33-31-16-55-2 22 12 14 15-10 20 24 33 53 1 65Z" fill="#ffe0a0" /></g>
        <g transform="rotate(9 450 655)"><path d="m446 530 8-9 8 9-5 185-6 20-5-20Z" fill="url(#scene-sword)" /><path d="M451 535v180" stroke="#eff1d9" strokeOpacity=".5" /><path d="M451 542c17 9 17 17 0 25s-17 16 0 25 17 17 0 25-17 16 0 25" stroke="#656c63" strokeWidth="4" /><path d="m424 533 4-7 24 4 26-4 4 7-30 5Z" fill="#93866a" /><path d="M449 491h8v35h-8Z" fill="#4c4437" stroke="#9e8965" /><path d="m447 488 6-9 7 9-7 8Z" fill="#b5a17b" /></g>
        <g stroke="#7d5140" strokeWidth="8" strokeLinecap="round"><path d="m420 750 62-12m-56-5 49 20m-29-27-13 26" /></g>
        <g fill="#e7a354"><circle cx="409" cy="755" r="2" /><circle cx="485" cy="747" r="2" /><circle cx="461" cy="760" r="1.5" /></g>
      </svg>
      <div className="scene-mist scene-mist-back" /><div className="scene-mist" />
    </div>
  );
}
