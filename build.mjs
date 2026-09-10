/* Common Table — static build. Charts are hand-rolled SVG from data/impact.json. No dependencies. */
import { readFileSync, writeFileSync } from 'node:fs';

const site = JSON.parse(readFileSync('data/site.json','utf8'));
const im   = JSON.parse(readFileSync('data/impact.json','utf8'));
const give = JSON.parse(readFileSync('data/give.json','utf8'));

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const comma = n => n.toLocaleString('en-US');
const compact = n => n>=1e6 ? (n/1e6).toFixed(n%1e6?1:0)+'M' : n>=1e3 ? Math.round(n/1e3)+'k' : String(n);
const usd = n => '$'+comma(n);
const telRaw = site.phone.replace(/[^\d+]/g,'');
const fmt = (n,f) => f==='compact' ? compact(n) : f==='comma' ? comma(n) : String(n);

/* ---------- tiles ---------- */
const TILES = im.headline.map(t => `
      <div class="tile rv"><b>${fmt(t.n,t.format)}</b><span class="l">${esc(t.label)}</span><span class="sb">${esc(t.sub)}</span></div>`).join('');

/* ---------- line + area: meals by year ---------- */
function lineChart(rows){
  const W=560,H=240,P={t:18,r:16,b:30,l:52};
  const iw=W-P.l-P.r, ih=H-P.t-P.b;
  const max=Math.ceil(Math.max(...rows.map(r=>r.meals))/50000)*50000;
  const x=i=>P.l+(iw*(i/(rows.length-1)));
  const y=v=>P.t+ih-(v/max)*ih;
  const pts=rows.map((r,i)=>[x(i),y(r.meals)]);
  const path=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area=`${path} L ${x(rows.length-1).toFixed(1)} ${(P.t+ih).toFixed(1)} L ${P.l} ${(P.t+ih).toFixed(1)} Z`;
  const ticks=[0,.25,.5,.75,1].map(f=>{
    const v=max*f, yy=y(v);
    return `<line class="grid-line" x1="${P.l}" y1="${yy.toFixed(1)}" x2="${W-P.r}" y2="${yy.toFixed(1)}"/>
      <text class="axis-t" x="${P.l-8}" y="${(yy+4).toFixed(1)}" text-anchor="end">${compact(v)}</text>`}).join('');
  const peak=rows.reduce((a,b)=>b.meals>a.meals?b:a);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="c1t c1d">
    <title id="c1t">Meals distributed each year</title>
    <desc id="c1d">Rising from ${comma(rows[0].meals)} in ${rows[0].year} to ${comma(rows[rows.length-1].meals)} in ${rows[rows.length-1].year}.</desc>
    <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0F4C5C" stop-opacity=".26"/>
      <stop offset="100%" stop-color="#0F4C5C" stop-opacity="0"/></linearGradient></defs>
    ${ticks}
    <path class="area" d="${area}"/>
    <path class="line" d="${path}"/>
    ${pts.map((p,i)=>`<circle class="dot${rows[i]===peak?' dot-hi':''}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4"/>`).join('')}
    ${rows.map((r,i)=>`<text class="axis-t" x="${x(i).toFixed(1)}" y="${H-8}" text-anchor="middle">${r.year}</text>`).join('')}
  </svg>`;
}

/* ---------- donut: spending ---------- */
function donut(rows){
  const S=210,cx=S/2,cy=S/2,r=78,sw=26,C=2*Math.PI*r;
  const cols=['#0F4C5C','#2E8091','#9C5D0D','#7A6A55'];
  let off=0;
  const arcs=rows.map((row,i)=>{
    const len=C*(row.pct/100);
    const el=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${cols[i%4]}" stroke-width="${sw}"
      stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})"><title>${esc(row.label)}: ${row.pct}%</title></circle>`;
    off+=len; return el;
  }).join('');
  const prog=rows[0].pct;
  return `<svg viewBox="0 0 ${S} ${S}" role="img" aria-labelledby="c2t c2d">
    <title id="c2t">How each dollar is spent</title>
    <desc id="c2d">${rows.map(r=>`${r.label} ${r.pct} percent`).join(', ')}.</desc>
    ${arcs}
    <text x="${cx}" y="${cy-2}" text-anchor="middle" style="font-family:Newsreader,serif;font-weight:600;font-size:30px;fill:#0F4C5C">${prog}%</text>
    <text x="${cx}" y="${cy+18}" text-anchor="middle" class="axis-t">to food</text>
  </svg>`;
}

/* ---------- horizontal bars: neighborhoods ---------- */
function bars(rows){
  const W=560,rh=30,gap=8,H=rows.length*(rh+gap);
  const max=Math.max(...rows.map(r=>r.meals));
  const labW=140, barW=W-labW-70;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="c3t c3d">
    <title id="c3t">Meals by neighborhood, FY2026</title>
    <desc id="c3d">${rows.map(r=>`${r.name} ${comma(r.meals)}`).join(', ')}.</desc>
    ${rows.map((r,i)=>{
      const y=i*(rh+gap), w=(r.meals/max)*barW;
      return `<g class="barrow">
        <text class="bar-l" x="0" y="${y+rh/2+4}">${esc(r.name)}</text>
        <rect class="bar" x="${labW}" y="${y+4}" width="${w.toFixed(1)}" height="${rh-8}" rx="3"><title>${esc(r.name)}: ${comma(r.meals)} meals</title></rect>
        <text class="bar-v" x="${(labW+w+8).toFixed(1)}" y="${y+rh/2+4}">${comma(r.meals)}</text>
      </g>`}).join('')}
  </svg>`;
}

const cols=['#0F4C5C','#2E8091','#9C5D0D','#7A6A55'];
const LEGEND = im.spending.map((r,i)=>`
        <li><span class="sw" style="background:${cols[i%4]}"></span>
        <span>${esc(r.label)}<br><span class="am">${usd(r.amount)}</span></span>
        <span class="pc">${r.pct}%</span></li>`).join('');

const SRCBAR = im.sources.map((s,i)=>
  `<span style="width:${s.pct}%;background:${cols[i%4]}" title="${esc(s.label)} ${s.pct}%"></span>`).join('');
const SRCLEG = im.sources.map((s,i)=>`
        <li><span class="sw" style="background:${cols[i%4]}"></span><span>${esc(s.label)}</span><span class="pc">${s.pct}%</span></li>`).join('');

/* accessible table fallback */
const TABLE = `<table class="vh"><caption>Meals distributed by year</caption><tbody>
  ${im.mealsByYear.map(r=>`<tr><th scope="row">${r.year}</th><td>${comma(r.meals)}</td></tr>`).join('')}
</tbody></table>`;

const TIERS = give.tiers.map(t=>`
      <button class="tier rv" type="button" data-amt="${t.amount}" aria-pressed="false">
        ${t.featured?'<span class="flag">Most given</span>':''}
        <span class="amt">$${t.amount}</span>
        <span class="meals">${comma(Math.round(t.amount/give.costPerMeal))} meals</span>
        <p class="nt">${esc(t.note)}</p>
      </button>`).join('');

const d = site.demo||{};
const DEMOBAR = d.show?`<div class="demo-bar" role="note"><p>${esc(d.text)}</p><span class="sep">&middot;</span>
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>`:'';
const DEMOFOOT = d.show?`<div class="demo-foot">${esc(d.text)}
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>`:'';

const JSONLD = JSON.stringify({'@context':'https://schema.org','@type':'NGO',
  name:site.name, description:site.mission, telephone:site.phone, email:site.email,
  address:{'@type':'PostalAddress',streetAddress:site.office.line1,addressLocality:'Chicago'}});

const SCRIPT = `<script>
document.getElementById('yr').textContent=new Date().getFullYear();
var nav=document.getElementById('nav');
addEventListener('scroll',function(){nav.classList.toggle('stuck',scrollY>12)},{passive:true});
if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.05});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
}else{document.querySelectorAll('.rv').forEach(function(el){el.classList.add('in')})}

var COST=${give.costPerMeal};
var amt=document.getElementById('amt'), out=document.getElementById('impactOut'),
    tiers=document.querySelectorAll('.tier');
function meals(v){ return Math.round(v/COST).toLocaleString('en-US') }
function paint(){
  var v=parseFloat(amt.value);
  if(!v||v<1){ out.innerHTML='Enter an amount to see what it covers.'; return }
  out.innerHTML='<b>$'+v.toLocaleString('en-US')+'</b> puts <b>'+meals(v)+' meals</b> on tables, at our current cost of $'+COST.toFixed(2)+' per meal.';
  tiers.forEach(function(t){ t.setAttribute('aria-pressed',String(+t.dataset.amt===v)) });
}
tiers.forEach(function(t){ t.addEventListener('click',function(){ amt.value=t.dataset.amt; paint() }) });
amt.addEventListener('input',paint);
paint();
document.getElementById('giveGo').addEventListener('click',function(){
  var v=parseFloat(amt.value)||0;
  this.textContent = v>0 ? 'Demo only \\u2014 Zeffy would open here' : 'Enter an amount first';
  var b=this; setTimeout(function(){ b.textContent='Give $'+(parseFloat(amt.value)||0) },2400);
});
</script>`;

const vars = {
  NAME:esc(site.name), TAGLINE:esc(site.tagline), EIN:esc(site.ein), FY:esc(site.fiscalYear),
  MISSION:esc(site.mission), MISSION_SHORT:esc(site.mission.split('. ')[0]+'.'),
  PHONE:esc(site.phone), PHONE_RAW:telRaw, EMAIL:esc(site.email),
  OFF1:esc(site.office.line1), OFF2:esc(site.office.line2),
  TILES, LEGEND, SRCBAR, SRCLEG, TIERS, TABLE, DEMOBAR, DEMOFOOT, SCRIPT, JSONLD,
  CHART_LINE: lineChart(im.mealsByYear),
  CHART_DONUT: donut(im.spending),
  CHART_BARS: bars(im.byNeighborhood),
  UPDATED: new Date(im.updated+'T00:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),
  COSTPERMEAL: give.costPerMeal.toFixed(2),
  MONTHLY: give.monthly.amount, MONTHLY_NOTE: esc(give.monthly.note),
  MONTHLY_MEALS: comma(Math.round(give.monthly.amount*12/give.costPerMeal))
};
const out = readFileSync('src/index.template.html','utf8')
  .replace(/\{\{(\w+)\}\}/g,(m,k)=> k in vars ? vars[k] : (console.warn('  ! unknown token',k),m));
writeFileSync('index.html', out);
console.log('  built index.html');
console.log(`  ${im.headline.length} tiles, 3 charts, ${im.byNeighborhood.length} neighborhoods, ${give.tiers.length} giving tiers`);
