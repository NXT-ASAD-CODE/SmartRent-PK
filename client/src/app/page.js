"use client";

import React, { useEffect, useRef } from "react";

const ORIGINAL_BODY = String.raw`
<svg aria-hidden="true" height="0" style="position:absolute" width="0">
<symbol id="ck" viewbox="0 0 20 20"><circle cx="10" cy="10" fill="none" r="9" stroke="currentColor" stroke-width="1.6"></circle><path d="M5.8 10.4l2.8 2.8 5.6-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"></path></symbol>
<symbol id="pd" viewbox="0 0 20 20"><circle cx="10" cy="10" fill="none" r="9" stroke="currentColor" stroke-dasharray="3 3" stroke-width="1.6"></circle></symbol>
<symbol id="wn" viewbox="0 0 20 20"><path d="M10 2.5l8 14H2z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.6"></path><path d="M10 8v4M10 14.2v.1" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"></path></symbol>
</svg>
<div id="view-home">
<header class="nav">
<div class="wrap">
<a aria-label="SmartRent PK home" class="brand" href="#top">
<svg aria-hidden="true" height="26" viewbox="0 0 26 26" width="26"><rect fill="currentColor" height="11" rx="2" width="11" x="1" y="1"></rect><rect fill="currentColor" height="11" rx="2" width="11" x="14" y="1"></rect><rect fill="currentColor" height="11" rx="2" width="11" x="1" y="14"></rect><rect fill="var(--signal)" height="11" rx="2" width="11" x="14" y="14"></rect></svg>
      SmartRent PK
    </a>
<nav aria-label="Main" class="links">
<a href="#how">How it works</a>
<a href="#safety">Safety</a>
<a href="#pricing">Pricing</a>
<a href="#faq">Questions</a>
</nav>
<a class="btn small" href="#/rent">Rent a locker</a>
<button aria-controls="mnav" aria-expanded="false" aria-label="Open menu" class="menubtn" id="menuBtn" type="button"><svg aria-hidden="true" height="22" viewbox="0 0 22 22" width="22"><path d="M3 6h16M3 11h16M3 16h16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"></path></svg></button>
</div>
<nav aria-label="Mobile" class="mnav" hidden="" id="mnav">
<a href="#how">How it works</a>
<a href="#safety">Safety</a>
<a href="#pricing">Pricing</a>
<a href="#faq">Questions</a>
<a class="btn" href="#/rent">Rent a locker</a>
</nav>
</header>
<main id="top">
<section class="hero">
<div class="wrap">
<div>
<h1>A locker you rent by the hour and open with your phone</h1>
<p class="lede">Secure, same-size lockers. Pay by QR, verify with a one-time code, and the door opens. No keys, and no waiting for someone to be home.</p>
<div class="cta">
<a class="btn ghost" href="#how">See how it works</a>
</div>
<p class="fine">Pilot machine: four lockers, one rate.</p>
</div>
<div class="machine">
<div aria-label="Demo locker machine" class="cabinet" role="group">
<div class="plate"><span>SmartRent PK</span><span><i class="dot"></i>Machine 01 online</span></div>
<div class="cell" data-n="1">
<div class="inside"><div class="parcel"></div></div>
<button aria-expanded="false" aria-label="Locker 1, free. Open it" class="door" type="button">
<span class="led"></span><span class="num">1</span><span class="state">Free</span><span class="handle"></span>
</button>
</div>
<div class="cell" data-n="2">
<div class="inside"><div class="parcel"></div></div>
<button aria-expanded="false" aria-label="Locker 2, free. Open it" class="door" type="button">
<span class="led"></span><span class="num">2</span><span class="state">Free</span><span class="handle"></span>
</button>
</div>
<div class="cell used" data-n="3">
<div class="inside"><div class="parcel"></div></div>
<button aria-expanded="false" aria-label="Locker 3, free. Open it" class="door" type="button">
<span class="led"></span><span class="num">3</span><span class="state">Free</span><span class="handle"></span>
</button>
</div>
<div class="cell" data-n="4">
<div class="inside"><div class="parcel"></div></div>
<button aria-expanded="false" aria-label="Locker 4, free. Open it" class="door" type="button">
<span class="led"></span><span class="num">4</span><span class="state">Free</span><span class="handle"></span>
</button>
</div>
</div>
<div aria-live="polite" class="status" id="status">
<svg aria-hidden="true" height="18" width="18"><use href="#ck"></use></svg>
<span id="statusText">Try it: tap a free locker. This is a demo. Real lockers open after payment and a one-time code.</span>
</div>
<button class="btn full" hidden="" id="rentSel" style="margin-top:6px" type="button">Rent locker</button>
</div>
<a class="btn rent-wide" href="#/rent">Rent a locker</a>
</div>
</section>
<section class="section" id="how">
<div class="wrap">
<h2>Four steps from scan to stored</h2>
<ol class="steps">
<li><div class="n">1</div><h3>Choose a locker</h3><p>Scan the QR code on the machine and tap a free locker on the map.</p></li>
<li><div class="n">2</div><h3>Pay by QR</h3><p>Pick your time and pay with your banking app. Nothing unlocks until payment is confirmed.</p></li>
<li><div class="n">3</div><h3>Verify with a code</h3><p>Enter the one-time code sent to your phone. It expires quickly and works once.</p></li>
<li><div class="n">4</div><h3>Open, store, close</h3><p>The door unlocks and a sensor confirms it. Put your item inside and close the door.</p></li>
</ol>
</div>
</section>
<section class="section trust" id="safety">
<div class="wrap">
<div>
<h2>The app only says it's open when it is</h2>
<p class="lede" style="margin-top:16px">Sending an unlock command isn't proof the door moved. SmartRent PK waits for the door sensor before telling you anything worked.</p>
<ul class="facts">
<li><strong>One-time codes</strong><span>Short-lived and single-use, so a code you've already used can't open anything.</span></li>
<li><strong>Every action recorded</strong><span>Payments, codes, and door events are logged, so there's a clear history if something goes wrong.</span></li>
<li><strong>Problems reach a person</strong><span>If a payment goes through but the door doesn't open, staff are alerted and your case is started automatically.</span></li>
</ul>
</div>
<div aria-label="Example event log for Locker 2 showing payment, code, unlock command, and sensor confirmation" class="log" role="img">
<h3>Machine 01, Locker 2</h3>
<ol>
<li><svg aria-hidden="true" height="20" width="20"><use href="#ck"></use></svg>Payment verified</li>
<li><svg aria-hidden="true" height="20" width="20"><use href="#ck"></use></svg>Code verified</li>
<li><svg aria-hidden="true" height="20" width="20"><use href="#ck"></use></svg>Unlock command sent</li>
<li class="key"><svg aria-hidden="true" height="20" width="20"><use href="#ck"></use></svg>Door sensor reports open</li>
</ol>
<div class="fail"><svg aria-hidden="true" height="20" width="20"><use href="#wn"></use></svg><span>No sensor signal? We don't mark it as opened. We log an incident and alert staff.</span></div>
</div>
</div>
</section>
<section class="section pricing" id="pricing">
<div class="wrap">
<div>
<h2>One locker size, one simple rate</h2>
<p class="lede" style="margin-top:16px">Every locker is the same size and costs the same, so you only choose how long you need it. Pilot rate shown below. It may change after the pilot.</p>
</div>
<div class="calc">
<label for="hours">How long do you need it?</label>
<input id="hours" max="24" min="1" step="1" type="range" value="2"/>
<div class="row">
<span class="total" id="total">Rs.200</span>
<span class="meta"><span id="hoursText">2 hours</span> at Rs.100 per hour<br/>Ends <span id="endText"></span></span>
</div>
<button class="btn" id="rentHours" style="margin-top:20px" type="button">Rent for this time</button>
</div>
</div>
</section>
<section class="section" style="padding-top:0">
<div class="wrap">
<h2>Made for the days you can't be home</h2>
<div class="uses">
<div><h3>Parcels on your schedule</h3><p>Collect orders when it suits you instead of rearranging your day around a delivery.</p></div>
<div><h3>A few hours, hands free</h3><p>Leave a bag or laptop while you're at class, a meeting, or running errands.</p></div>
<div><h3>Handoffs without waiting</h3><p>Small businesses and delivery partners can leave an order for pickup and move on.</p></div>
</div>
</div>
</section>
<section class="section faq" id="faq">
<div class="wrap">
<h2>Questions people ask first</h2>
<div class="list">
<details><summary>What if I pay and the locker doesn't open?</summary><p>Your payment is recorded and the rental is flagged as a failed opening. Staff are alerted and our team starts resolving it, including a refund where it applies.</p></details>
<details><summary>What happens when my time runs out?</summary><p>Staff move your item to a secure holding area. Pay the overdue fee and you'll receive a one-time release code to collect it.</p></details>
<details><summary>Do I need an account?</summary><p>Yes. You create a free account and verify your phone with a one-time code.</p></details>
<details><summary>How big are the lockers?</summary><p>Every locker is the same size, so you never have to guess which one to pick.</p></details>
<details><summary>What if the machine loses its internet connection?</summary><p>New rentals pause until the machine is back online. Items already inside stay locked.</p></details>
<details><summary>What data do you keep?</summary><p>Only what's needed to run your rental and keep the machine safe: your phone number, payments, and a record of locker activity. We'll publish our privacy policy before launch.</p></details>
</div>
</div>
</section>
<section class="section find" id="find">
<div class="wrap">
<div>
<h2>We're starting with one machine</h2>
<p>Machine 01 has four lockers. Its location and opening date will be posted here.</p>
</div>
<a class="btn" href="#/rent">Rent a locker</a>
</div>
</section>
</main>
<footer>
<div class="wrap">
<span>SmartRent PK. Pilot in progress.</span>
<nav aria-label="Footer" class="flinks"><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#faq">Questions</a><a href="#/rent">Rent a locker</a><a href="#top">Back to top</a></nav>
<span style="flex-basis:100%">Pricing and policies may change before public launch.</span>
</div>
</footer>
</div>
<div hidden="" id="view-rent">
<header class="rentbar">
<div class="wrap">
<a class="backbtn" href="#/"><svg aria-hidden="true" height="18" viewbox="0 0 20 20" width="18"><path d="M12.5 4.5L7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>Back to home page</a>
<span class="rentbrand"><svg aria-hidden="true" height="26" viewbox="0 0 26 26" width="26"><rect fill="currentColor" height="11" rx="2" width="11" x="1" y="1"></rect><rect fill="currentColor" height="11" rx="2" width="11" x="14" y="1"></rect><rect fill="currentColor" height="11" rx="2" width="11" x="1" y="14"></rect><rect fill="var(--signal)" height="11" rx="2" width="11" x="14" y="14"></rect></svg>SmartRent PK</span>
</div>
</header>
<main>
<div class="wrap rentgrid">
<div aria-label="SmartRent PK app demo" class="phone" id="phone" role="group">
<div class="phone-top"><span>SmartRent PK</span><span><i class="dot"></i> Machine 01 online</span></div>
<div aria-live="polite" class="screen" id="screen"></div>
</div>
<div class="rintro">
<h1 class="rtitle">Rent a locker</h1>
<p class="lede" style="margin-top:14px">Pick a locker, pay, verify, and open. Payment and codes run in test mode, so nothing is charged.</p>
</div>
<div class="rnotes">
<ul class="facts">
<li><strong>Test details</strong><span>Any mobile number works. The test code is 482917.</span></li>
<li><strong>Already taken</strong><span>Locker 3 is in use, so it can't be chosen.</span></li>
<li><strong>Your time</strong><span>The countdown starts when the door sensor confirms the door is open.</span></li>
</ul>
<p style="margin-top:20px"><button class="btn ghost small" id="reset" type="button">Start over</button></p>
</div>
</div>
</main>
</div>
<script>
(function(){
var PRICE=100, TEST_CODE="482917";
var cells=document.querySelectorAll(".cell");
var statusText=document.getElementById("statusText");
var DEFAULT_STATUS=statusText.textContent;
var rentSel=document.getElementById("rentSel");
var screen=document.getElementById("screen");
var lockers, app, timers=[], tick=null;

function fresh(){
  lockers={1:"free",2:"free",3:"used",4:"free"};
  app={screen:"pick",locker:null,hours:1,paid:false,phone:"",codeSent:false,attempts:0,phase:"",endAt:0,steps:0,note:"",notice:""};
}
function clearAll(){ timers.forEach(clearTimeout); timers=[]; if(tick){clearInterval(tick);tick=null;} }
function later(fn,ms){ timers.push(setTimeout(fn,ms)); }
function pad(n){ return n<10?"0"+n:""+n; }
function fmt(sec){ var h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60; return h>0 ? h+":"+pad(m)+":"+pad(s) : pad(m)+":"+pad(s); }
function endLabel(h){
  var end=new Date(Date.now()+h*3600000);
  var same=end.toDateString()===new Date().toDateString();
  return end.toLocaleString([], same?{hour:"numeric",minute:"2-digit"}:{weekday:"short",hour:"numeric",minute:"2-digit"});
}
function money(n){ return "Rs."+n.toLocaleString("en-US"); }
function hrs(h){ return h+(h===1?" hour":" hours"); }
function icon(id){ return '<svg width="20" height="20" aria-hidden="true"><use href="#'+id+'"/></svg>'; }
function setErr(msg){ var e=document.getElementById("err"); if(e) e.textContent=msg; }

function qr(){
  var n=21, out="";
  function r(i){ var x=Math.sin(i*12.9898)*43758.5453; return x-Math.floor(x); }
  for(var y=0;y<n;y++){ for(var x=0;x<n;x++){
    if((x<8&&y<8)||(x>12&&y<8)||(x<8&&y>12)) continue;
    if(r(y*n+x+3)>0.5) out+='<rect x="'+x+'" y="'+y+'" width="1" height="1"/>';
  } }
  [[0,0],[14,0],[0,14]].forEach(function(p){
    out+='<rect x="'+p[0]+'" y="'+p[1]+'" width="7" height="7"/><rect x="'+(p[0]+1)+'" y="'+(p[1]+1)+'" width="5" height="5" fill="#fff"/><rect x="'+(p[0]+2)+'" y="'+(p[1]+2)+'" width="3" height="3"/>';
  });
  return '<svg viewBox="0 0 21 21" width="168" height="168" fill="#111" shape-rendering="crispEdges" role="img" aria-label="Test payment QR code">'+out+'</svg>';
}

function vPick(){
  var tiles=[1,2,3,4].map(function(n){
    var used=lockers[n]==="used", sel=app.locker===n;
    var word=used?"In use":(sel?"Selected":"Free");
    return '<button type="button" class="al'+(sel?" on":"")+'" data-act="pickN" data-n="'+n+'"'+(used?' aria-disabled="true"':"")+' aria-pressed="'+sel+'" aria-label="Locker '+n+", "+word.toLowerCase()+'"><b>'+n+"</b><span>"+word+"</span></button>";
  }).join("");
  var notice=app.notice?'<p class="pill ok" role="status" style="display:block;margin:0">'+app.notice+"</p>":"";
  return notice+'<div><h3>Tap a free locker</h3><p class="sub">The map matches the machine in front of you.</p></div><div class="amap">'+tiles+'</div><p class="err" id="err" role="alert"></p><button type="button" class="btn full" data-act="toTime">'+(app.locker?"Choose locker "+app.locker:"Choose a locker")+"</button>";
}
function vTime(){
  var list=[1,2,4,24];
  if(list.indexOf(app.hours)<0){ list.push(app.hours); list.sort(function(a,b){return a-b;}); }
  var chips=list.map(function(h){
    return '<button type="button" class="chip'+(app.hours===h?" on":"")+'" data-act="hours" data-h="'+h+'" aria-pressed="'+(app.hours===h)+'">'+hrs(h)+"</button>";
  }).join("");
  return '<button type="button" class="linkbtn" data-act="toPick">Change locker</button><div><h3>How long do you need locker '+app.locker+'?</h3><p class="sub">Same price for every locker. Ends at '+endLabel(app.hours)+'.</p></div><div class="chips">'+chips+'</div><div class="totalrow"><span class="sub">Total</span><b>'+money(app.hours*PRICE)+'</b></div><button type="button" class="btn full" data-act="toPay">Pay with QR</button>';
}
function vPay(){
  return '<div><h3>Pay '+money(app.hours*PRICE)+'</h3><p class="sub">Locker '+app.locker+", "+hrs(app.hours)+'</p></div><div class="qrbox">'+qr()+'</div><p class="sub" style="text-align:center">Scan with your banking app</p><div style="text-align:center">'+(app.paid?'<span class="pill ok">Payment verified</span>':'<span class="pill">Waiting for payment…</span>')+"</div>"+(app.paid?"":'<button type="button" class="btn ghost full" data-act="simPay">Simulate payment (test mode)</button><button type="button" class="linkbtn" data-act="toTime">Change time</button>');
}
function vVerify(){
  if(!app.codeSent){
    return '<div><h3>Verify your phone</h3><p class="sub">We text a one-time code. It expires quickly and works once.</p></div><div class="field"><label for="ph">Mobile number</label><input id="ph" inputmode="tel" autocomplete="tel" placeholder="0300 1234567"></div><p class="err" id="err" role="alert"></p><button type="button" class="btn full" data-act="sendCode">Send code</button>';
  }
  return '<div><h3>Enter your code</h3><p class="sub">Sent to '+app.phone+'. Test mode: use '+TEST_CODE+'.</p></div><div class="field"><label for="cd">6-digit code</label><input id="cd" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 digits"></div><p class="err" id="err" role="alert"></p><button type="button" class="btn full" data-act="verify">Verify and open</button><button type="button" class="linkbtn" data-act="resend">Use a different number</button>';
}
function vOpening(){
  var labels=[["Payment verified","Payment verified"],["Code verified","Code verified"],["Sending unlock command…","Unlock command sent"],["Waiting for the door sensor…","Door sensor reports open"]];
  var li=labels.map(function(l,i){ var d=i<app.steps; return '<li class="'+(d?"done":"wait")+'">'+icon(d?"ck":"pd")+"<span>"+(d?l[1]:l[0])+"</span></li>"; }).join("");
  return '<div><h3>Opening locker '+app.locker+'</h3><p class="sub">We only say it’s open once the door sensor confirms.</p></div><ol class="steplist">'+li+"</ol>";
}
function vActive(){
  var n=app.locker, p=app.phase;
  if(p==="done"){
    return '<div><h3>Rental ended</h3><p class="sub">Locker '+n+' is free again.</p></div><div class="totalrow"><span class="sub">Paid</span><b>'+money(app.hours*PRICE)+'</b></div><p class="sub">'+hrs(app.hours)+' in test mode. Nothing was charged.</p><button type="button" class="btn full" data-act="again">Rent another locker</button>';
  }
  var rem=Math.max(0,Math.round((app.endAt-Date.now())/1000));
  var open=(p==="placing"||p==="collecting");
  var head='<div class="tile"><div class="n">'+n+'</div><div><h3 style="font-size:20px">Locker '+n+(open?" is open":" is locked")+'</h3><p class="sub" style="color:var(--ok)">'+(open?"Confirmed by door sensor":"Door sensor reports closed")+"</p></div></div>";
  var timer='<div class="timerbox"><div class="timer" id="timer">'+fmt(rem)+'</div><p class="sub" id="timeSub">left on your rental</p></div>';
  if(p==="placing") return head+timer+'<p class="sub">Place your item inside and close the door. The app updates when the sensor sees it close.</p><button type="button" class="btn full" data-act="closed">I’ve closed the door</button>';
  if(p==="collecting") return head+timer+'<p class="sub">Take your item, then close the door.</p><button type="button" class="btn full" data-act="taken">I’ve taken my item</button>';
  return head+timer+(app.note?'<p class="sub" role="status">'+app.note+"</p>":"")+'<div class="btnrow"><button type="button" class="btn ghost" data-act="addHour">Add 1 hour</button><button type="button" class="btn" data-act="collect">Collect item</button></div>';
}

function paintHero(){
  cells.forEach(function(cell){
    var n=+cell.dataset.n, st=lockers[n], btn=cell.querySelector(".door");
    cell.classList.toggle("open",st==="open");
    cell.classList.toggle("used",st==="used");
    cell.classList.toggle("sel",app.locker===n && st!=="used");
    cell.querySelector(".state").textContent=st==="open"?"Open":(st==="used"?"In use":"Free");
    cell.querySelector(".led").classList.toggle("busy",st!=="free");
    if(st==="used"){
      btn.setAttribute("aria-disabled","true"); btn.removeAttribute("aria-expanded");
      btn.setAttribute("aria-label","Locker "+n+", in use");
    } else {
      btn.removeAttribute("aria-disabled"); btn.setAttribute("aria-expanded",st==="open"?"true":"false");
      btn.setAttribute("aria-label","Locker "+n+(st==="open"?", open. Close it":", free. Open it"));
    }
  });
  var can=app.locker && (app.screen==="pick"||app.screen==="time") && lockers[app.locker]!=="used";
  rentSel.hidden=!can;
  if(can) rentSel.textContent="Rent locker "+app.locker;
}

function updateTimer(){
  var t=document.getElementById("timer"); if(!t) return;
  var rem=Math.max(0,Math.round((app.endAt-Date.now())/1000));
  t.textContent=fmt(rem);
  var s=document.getElementById("timeSub");
  if(s) s.textContent=rem===0?"Time’s up. Collect your item to avoid an overdue fee.":"left on your rental";
}
function render(){
  if(tick){ clearInterval(tick); tick=null; }
  var views={pick:vPick,time:vTime,pay:vPay,verify:vVerify,opening:vOpening,active:vActive};
  screen.innerHTML=views[app.screen]();
  if(app.screen==="active" && app.phase!=="done") tick=setInterval(updateTimer,1000);
  paintHero();
}

function startOpening(){
  app.screen="opening"; app.steps=2; render();
  later(function(){ app.steps=3; render(); },800);
  later(function(){ app.steps=4; lockers[app.locker]="open"; statusText.textContent="Locker "+app.locker+" opened from the rental page. The door sensor confirmed it."; render(); },2000);
  later(function(){ app.screen="active"; app.phase="placing"; app.endAt=Date.now()+app.hours*3600000; render(); },3000);
}

screen.addEventListener("click",function(e){
  var t=e.target.closest("[data-act]"); if(!t) return;
  var a=t.dataset.act, n;
  if(a==="pickN"){
    n=+t.dataset.n;
    if(lockers[n]==="used"){ setErr("Locker "+n+" is in use. Pick another."); return; }
    app.locker=n; render();
  } else if(a==="toTime"){
    if(!app.locker){ setErr("Tap a free locker first."); return; }
    app.screen="time"; app.paid=false; render();
  } else if(a==="toPick"){ app.screen="pick"; render(); }
  else if(a==="hours"){ app.hours=+t.dataset.h; render(); }
  else if(a==="toPay"){ app.screen="pay"; app.paid=false; render(); }
  else if(a==="simPay"){
    app.paid=true; render();
    later(function(){ app.screen="verify"; render(); },900);
  } else if(a==="sendCode"){
    var v=document.getElementById("ph").value;
    if(v.replace(/\D/g,"").length<10){ setErr("Enter a valid mobile number."); return; }
    app.phone=v.trim(); app.codeSent=true; app.attempts=0; render();
    var c=document.getElementById("cd"); if(c) c.focus();
  } else if(a==="resend"){ app.codeSent=false; render(); }
  else if(a==="verify"){
    var code=document.getElementById("cd").value.trim();
    if(!/^\d{6}$/.test(code)){ setErr("Enter the 6-digit code."); return; }
    if(code!==TEST_CODE){
      app.attempts++;
      if(app.attempts>=3){ app.codeSent=false; app.attempts=0; render(); setErr("Too many wrong codes. Request a new one."); }
      else setErr("That code isn’t right. Try again ("+app.attempts+" of 3).");
      return;
    }
    startOpening();
  } else if(a==="closed"){
    lockers[app.locker]="used"; app.phase="running";
    statusText.textContent="Locker "+app.locker+" is locked and in use.";
    render();
  } else if(a==="addHour"){
    app.endAt+=3600000; app.hours+=1; app.note="1 hour added for "+money(PRICE)+" (test mode)."; render();
  } else if(a==="collect"){
    lockers[app.locker]="open"; app.phase="collecting"; app.note="";
    statusText.textContent="Locker "+app.locker+" is open for collection.";
    render();
  } else if(a==="taken"){
    var done=app.locker, paid=app.hours*PRICE;
    clearAll(); fresh();
    app.notice="Rental ended. Locker "+done+" is free again. Paid "+money(paid)+" (test mode).";
    statusText.textContent="Locker "+done+" is free again.";
    render();
  } else if(a==="again"){ clearAll(); fresh(); statusText.textContent=DEFAULT_STATUS; render(); }
});
screen.addEventListener("input",function(){ setErr(""); });
screen.addEventListener("keydown",function(e){
  if(e.key==="Enter" && e.target.tagName==="INPUT"){ var b=screen.querySelector(".btn.full"); if(b) b.click(); }
});

cells.forEach(function(cell){
  cell.querySelector(".door").addEventListener("click",function(){
    var n=+cell.dataset.n;
    if(lockers[n]==="used"){ statusText.textContent="Locker "+n+" is in use."; return; }
    if((app.screen==="opening"||app.screen==="active") && n===app.locker) return;
    var open=lockers[n]!=="open";
    lockers[n]=open?"open":"free";
    if(app.screen==="pick"||app.screen==="time"){ app.locker=n; render(); } else { paintHero(); }
    statusText.textContent=open
      ? "Locker "+n+" open. Door sensor confirmed. Real lockers only open after payment and a one-time code."
      : "Locker "+n+" closed. The sensor confirms the door is shut.";
  });
});
rentSel.addEventListener("click",function(){
  if(app.locker && (app.screen==="pick"||app.screen==="time")){ app.screen="time"; render(); }
  location.hash="#/rent";
});
document.getElementById("reset").addEventListener("click",function(){ clearAll(); fresh(); statusText.textContent=DEFAULT_STATUS; render(); });

var hours=document.getElementById("hours");
var total=document.getElementById("total");
var hoursText=document.getElementById("hoursText");
var endText=document.getElementById("endText");
function updateCalc(){
  var h=parseInt(hours.value,10);
  total.textContent=money(h*PRICE);
  hoursText.textContent=hrs(h);
  document.getElementById("rentHours").textContent="Rent for "+hrs(h);
  endText.textContent=endLabel(h);
}
hours.addEventListener("input",updateCalc);
updateCalc();

var menuBtn=document.getElementById("menuBtn"), mnav=document.getElementById("mnav");
function setMenu(open){ mnav.hidden=!open; menuBtn.setAttribute("aria-expanded",open?"true":"false"); menuBtn.setAttribute("aria-label",open?"Close menu":"Open menu"); }
menuBtn.addEventListener("click",function(){ setMenu(mnav.hidden); });
mnav.addEventListener("click",function(e){ if(e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown",function(e){ if(e.key==="Escape" && !mnav.hidden){ setMenu(false); menuBtn.focus(); } });
window.addEventListener("hashchange",function(){ setMenu(false); });

var rentHours=document.getElementById("rentHours");
rentHours.addEventListener("click",function(){
  var h=parseInt(hours.value,10);
  if(app.screen==="pick"||app.screen==="time"){ app.hours=h; if(app.locker) app.screen="time"; render(); }
  location.hash="#/rent";
});

var viewHome=document.getElementById("view-home"), viewRent=document.getElementById("view-rent");
var HOME_TITLE=document.title, homeY=0;
window.addEventListener("scroll",function(){ if(!viewHome.hidden) homeY=window.scrollY; },{passive:true});
function route(initial){
  var rent=location.hash==="#/rent";
  viewHome.hidden=rent; viewRent.hidden=!rent;
  document.title=rent?"Rent a locker | SmartRent PK":HOME_TITLE;
  if(rent){
    if(window.innerWidth<=900) document.getElementById("phone").scrollIntoView(); else window.scrollTo(0,0);
  } else {
    var id=location.hash.slice(1), t=(id && id.charAt(0)!=="/") ? document.getElementById(id) : null;
    if(t) t.scrollIntoView(); else window.scrollTo(0,initial?0:homeY);
  }
}
window.addEventListener("hashchange",function(){ route(false); });
route(true);

fresh(); render();
})();
if(!matchMedia("(prefers-reduced-motion:reduce)").matches){
  document.documentElement.classList.add("js");
  var rv=document.querySelectorAll(".steps li,.facts li,.log,.calc,.uses div,details,.section h2,.find .wrap>*");
  rv.forEach(function(el,i){ el.classList.add("rv"); el.style.setProperty("--d",(i%4)*0.1+"s"); });
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  },{threshold:.15});
  rv.forEach(function(el){ io.observe(el); });

  // doors take turns peeking open until the visitor interacts
  var order=[1,2,4], k=0, demo=setInterval(function(){
    var c=document.querySelector('.cell[data-n="'+order[k++%3]+'"]');
    if(!c||c.classList.contains("open")) return;
    c.classList.add("peek"); setTimeout(function(){ c.classList.remove("peek"); },1100);
  },2600);
  document.querySelector(".cabinet").addEventListener("click",function(){
    clearInterval(demo); document.querySelectorAll(".peek").forEach(function(c){c.classList.remove("peek");});
  },{once:true});
}
(function(){
  var hero=document.querySelector(".hero"); if(!hero) return;
  var bg=document.createElement("div"); bg.className="hero-bg"; bg.setAttribute("aria-hidden","true");
  var grid=document.createElement("div"); grid.className="lk-grid"; bg.appendChild(grid);
  hero.insertBefore(bg,hero.firstChild);
  var cells=[], cols=0, rows=0, STEP=76;

  function build(){
    var w=hero.clientWidth, h=hero.clientHeight; if(w<50) return;
    cols=Math.ceil(w/STEP); rows=Math.ceil(h/STEP);
    grid.style.setProperty("--c",cols); grid.style.setProperty("--r",rows);
    grid.innerHTML=""; cells=[];
    for(var i=0;i<cols*rows;i++){
      var d=document.createElement("div"); d.className="lk"; d.appendChild(document.createElement("i"));
      grid.appendChild(d); cells.push(d);
    }
  }
  function pop(c,ms){
    if(!c||c.classList.contains("on")) return;
    c.classList.add("on"); setTimeout(function(){ c.classList.remove("on"); },ms);
  }
  build();
  var t; window.addEventListener("resize",function(){ clearTimeout(t); t=setTimeout(build,200); });

  if(matchMedia("(prefers-reduced-motion:reduce)").matches) return;

  // random doors opening on their own
  setInterval(function(){
    if(!cells.length||hero.offsetParent===null) return;
    for(var k=0;k<3;k++) pop(cells[Math.floor(Math.random()*cells.length)],1800+Math.random()*1800);
  },500);

  // doors open under the cursor
  hero.addEventListener("pointermove",function(e){
    var r=hero.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
    hero.style.setProperty("--mx",x+"px"); hero.style.setProperty("--my",y+"px");
    bg.style.setProperty("--mx",x+"px"); bg.style.setProperty("--my",y+"px");
    var c=Math.floor(x/(r.width/cols)), rw=Math.floor(y/(r.height/rows));
    pop(cells[rw*cols+c],1400);
  });
})();
(function(){
  // wrap the brand text so it can be animated separately from the logo
  document.querySelectorAll(".brand,.rentbrand").forEach(function(b){
    Array.prototype.slice.call(b.childNodes).forEach(function(n){
      if(n.nodeType===3 && n.textContent.trim()){
        var s=document.createElement("span"); s.className="brand-t"; s.textContent=n.textContent.trim();
        b.replaceChild(s,n);
      }
    });
  });
  // shrink the navbar and add a shadow once the page scrolls
  var nav=document.querySelector(".nav");
  function onScroll(){ if(nav) nav.classList.toggle("scrolled",window.scrollY>12); }
  window.addEventListener("scroll",onScroll,{passive:true}); onScroll();
})();
</script>
`;

const ORIGINAL_SCRIPT = String.raw`
(function(){
var PRICE=100, TEST_CODE="482917";
var cells=document.querySelectorAll(".cell");
var statusText=document.getElementById("statusText");
var DEFAULT_STATUS=statusText.textContent;
var rentSel=document.getElementById("rentSel");
var screen=document.getElementById("screen");
var lockers, app, timers=[], tick=null;

function fresh(){
  lockers={1:"free",2:"free",3:"used",4:"free"};
  app={screen:"pick",locker:null,hours:1,paid:false,phone:"",codeSent:false,attempts:0,phase:"",endAt:0,steps:0,note:"",notice:""};
}
function clearAll(){ timers.forEach(clearTimeout); timers=[]; if(tick){clearInterval(tick);tick=null;} }
function later(fn,ms){ timers.push(setTimeout(fn,ms)); }
function pad(n){ return n<10?"0"+n:""+n; }
function fmt(sec){ var h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), s=sec%60; return h>0 ? h+":"+pad(m)+":"+pad(s) : pad(m)+":"+pad(s); }
function endLabel(h){
  var end=new Date(Date.now()+h*3600000);
  var same=end.toDateString()===new Date().toDateString();
  return end.toLocaleString([], same?{hour:"numeric",minute:"2-digit"}:{weekday:"short",hour:"numeric",minute:"2-digit"});
}
function money(n){ return "Rs."+n.toLocaleString("en-US"); }
function hrs(h){ return h+(h===1?" hour":" hours"); }
function icon(id){ return '<svg width="20" height="20" aria-hidden="true"><use href="#'+id+'"/></svg>'; }
function setErr(msg){ var e=document.getElementById("err"); if(e) e.textContent=msg; }

function qr(){
  var n=21, out="";
  function r(i){ var x=Math.sin(i*12.9898)*43758.5453; return x-Math.floor(x); }
  for(var y=0;y<n;y++){ for(var x=0;x<n;x++){
    if((x<8&&y<8)||(x>12&&y<8)||(x<8&&y>12)) continue;
    if(r(y*n+x+3)>0.5) out+='<rect x="'+x+'" y="'+y+'" width="1" height="1"/>';
  } }
  [[0,0],[14,0],[0,14]].forEach(function(p){
    out+='<rect x="'+p[0]+'" y="'+p[1]+'" width="7" height="7"/><rect x="'+(p[0]+1)+'" y="'+(p[1]+1)+'" width="5" height="5" fill="#fff"/><rect x="'+(p[0]+2)+'" y="'+(p[1]+2)+'" width="3" height="3"/>';
  });
  return '<svg viewBox="0 0 21 21" width="168" height="168" fill="#111" shape-rendering="crispEdges" role="img" aria-label="Test payment QR code">'+out+'</svg>';
}

function vPick(){
  var tiles=[1,2,3,4].map(function(n){
    var used=lockers[n]==="used", sel=app.locker===n;
    var word=used?"In use":(sel?"Selected":"Free");
    return '<button type="button" class="al'+(sel?" on":"")+'" data-act="pickN" data-n="'+n+'"'+(used?' aria-disabled="true"':"")+' aria-pressed="'+sel+'" aria-label="Locker '+n+", "+word.toLowerCase()+'"><b>'+n+"</b><span>"+word+"</span></button>";
  }).join("");
  var notice=app.notice?'<p class="pill ok" role="status" style="display:block;margin:0">'+app.notice+"</p>":"";
  return notice+'<div><h3>Tap a free locker</h3><p class="sub">The map matches the machine in front of you.</p></div><div class="amap">'+tiles+'</div><p class="err" id="err" role="alert"></p><button type="button" class="btn full" data-act="toTime">'+(app.locker?"Choose locker "+app.locker:"Choose a locker")+"</button>";
}
function vTime(){
  var list=[1,2,4,24];
  if(list.indexOf(app.hours)<0){ list.push(app.hours); list.sort(function(a,b){return a-b;}); }
  var chips=list.map(function(h){
    return '<button type="button" class="chip'+(app.hours===h?" on":"")+'" data-act="hours" data-h="'+h+'" aria-pressed="'+(app.hours===h)+'">'+hrs(h)+"</button>";
  }).join("");
  return '<button type="button" class="linkbtn" data-act="toPick">Change locker</button><div><h3>How long do you need locker '+app.locker+'?</h3><p class="sub">Same price for every locker. Ends at '+endLabel(app.hours)+'.</p></div><div class="chips">'+chips+'</div><div class="totalrow"><span class="sub">Total</span><b>'+money(app.hours*PRICE)+'</b></div><button type="button" class="btn full" data-act="toPay">Pay with QR</button>';
}
function vPay(){
  return '<div><h3>Pay '+money(app.hours*PRICE)+'</h3><p class="sub">Locker '+app.locker+", "+hrs(app.hours)+'</p></div><div class="qrbox">'+qr()+'</div><p class="sub" style="text-align:center">Scan with your banking app</p><div style="text-align:center">'+(app.paid?'<span class="pill ok">Payment verified</span>':'<span class="pill">Waiting for payment…</span>')+"</div>"+(app.paid?"":'<button type="button" class="btn ghost full" data-act="simPay">Simulate payment (test mode)</button><button type="button" class="linkbtn" data-act="toTime">Change time</button>');
}
function vVerify(){
  if(!app.codeSent){
    return '<div><h3>Verify your phone</h3><p class="sub">We text a one-time code. It expires quickly and works once.</p></div><div class="field"><label for="ph">Mobile number</label><input id="ph" inputmode="tel" autocomplete="tel" placeholder="0300 1234567"></div><p class="err" id="err" role="alert"></p><button type="button" class="btn full" data-act="sendCode">Send code</button>';
  }
  return '<div><h3>Enter your code</h3><p class="sub">Sent to '+app.phone+'. Test mode: use '+TEST_CODE+'.</p></div><div class="field"><label for="cd">6-digit code</label><input id="cd" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 digits"></div><p class="err" id="err" role="alert"></p><button type="button" class="btn full" data-act="verify">Verify and open</button><button type="button" class="linkbtn" data-act="resend">Use a different number</button>';
}
function vOpening(){
  var labels=[["Payment verified","Payment verified"],["Code verified","Code verified"],["Sending unlock command…","Unlock command sent"],["Waiting for the door sensor…","Door sensor reports open"]];
  var li=labels.map(function(l,i){ var d=i<app.steps; return '<li class="'+(d?"done":"wait")+'">'+icon(d?"ck":"pd")+"<span>"+(d?l[1]:l[0])+"</span></li>"; }).join("");
  return '<div><h3>Opening locker '+app.locker+'</h3><p class="sub">We only say it’s open once the door sensor confirms.</p></div><ol class="steplist">'+li+"</ol>";
}
function vActive(){
  var n=app.locker, p=app.phase;
  if(p==="done"){
    return '<div><h3>Rental ended</h3><p class="sub">Locker '+n+' is free again.</p></div><div class="totalrow"><span class="sub">Paid</span><b>'+money(app.hours*PRICE)+'</b></div><p class="sub">'+hrs(app.hours)+' in test mode. Nothing was charged.</p><button type="button" class="btn full" data-act="again">Rent another locker</button>';
  }
  var rem=Math.max(0,Math.round((app.endAt-Date.now())/1000));
  var open=(p==="placing"||p==="collecting");
  var head='<div class="tile"><div class="n">'+n+'</div><div><h3 style="font-size:20px">Locker '+n+(open?" is open":" is locked")+'</h3><p class="sub" style="color:var(--ok)">'+(open?"Confirmed by door sensor":"Door sensor reports closed")+"</p></div></div>";
  var timer='<div class="timerbox"><div class="timer" id="timer">'+fmt(rem)+'</div><p class="sub" id="timeSub">left on your rental</p></div>';
  if(p==="placing") return head+timer+'<p class="sub">Place your item inside and close the door. The app updates when the sensor sees it close.</p><button type="button" class="btn full" data-act="closed">I’ve closed the door</button>';
  if(p==="collecting") return head+timer+'<p class="sub">Take your item, then close the door.</p><button type="button" class="btn full" data-act="taken">I’ve taken my item</button>';
  return head+timer+(app.note?'<p class="sub" role="status">'+app.note+"</p>":"")+'<div class="btnrow"><button type="button" class="btn ghost" data-act="addHour">Add 1 hour</button><button type="button" class="btn" data-act="collect">Collect item</button></div>';
}

function paintHero(){
  cells.forEach(function(cell){
    var n=+cell.dataset.n, st=lockers[n], btn=cell.querySelector(".door");
    cell.classList.toggle("open",st==="open");
    cell.classList.toggle("used",st==="used");
    cell.classList.toggle("sel",app.locker===n && st!=="used");
    cell.querySelector(".state").textContent=st==="open"?"Open":(st==="used"?"In use":"Free");
    cell.querySelector(".led").classList.toggle("busy",st!=="free");
    if(st==="used"){
      btn.setAttribute("aria-disabled","true"); btn.removeAttribute("aria-expanded");
      btn.setAttribute("aria-label","Locker "+n+", in use");
    } else {
      btn.removeAttribute("aria-disabled"); btn.setAttribute("aria-expanded",st==="open"?"true":"false");
      btn.setAttribute("aria-label","Locker "+n+(st==="open"?", open. Close it":", free. Open it"));
    }
  });
  var can=app.locker && (app.screen==="pick"||app.screen==="time") && lockers[app.locker]!=="used";
  rentSel.hidden=!can;
  if(can) rentSel.textContent="Rent locker "+app.locker;
}

function updateTimer(){
  var t=document.getElementById("timer"); if(!t) return;
  var rem=Math.max(0,Math.round((app.endAt-Date.now())/1000));
  t.textContent=fmt(rem);
  var s=document.getElementById("timeSub");
  if(s) s.textContent=rem===0?"Time’s up. Collect your item to avoid an overdue fee.":"left on your rental";
}
function render(){
  if(tick){ clearInterval(tick); tick=null; }
  var views={pick:vPick,time:vTime,pay:vPay,verify:vVerify,opening:vOpening,active:vActive};
  screen.innerHTML=views[app.screen]();
  if(app.screen==="active" && app.phase!=="done") tick=setInterval(updateTimer,1000);
  paintHero();
}

function startOpening(){
  app.screen="opening"; app.steps=2; render();
  later(function(){ app.steps=3; render(); },800);
  later(function(){ app.steps=4; lockers[app.locker]="open"; statusText.textContent="Locker "+app.locker+" opened from the rental page. The door sensor confirmed it."; render(); },2000);
  later(function(){ app.screen="active"; app.phase="placing"; app.endAt=Date.now()+app.hours*3600000; render(); },3000);
}

screen.addEventListener("click",function(e){
  var t=e.target.closest("[data-act]"); if(!t) return;
  var a=t.dataset.act, n;
  if(a==="pickN"){
    n=+t.dataset.n;
    if(lockers[n]==="used"){ setErr("Locker "+n+" is in use. Pick another."); return; }
    app.locker=n; render();
  } else if(a==="toTime"){
    if(!app.locker){ setErr("Tap a free locker first."); return; }
    app.screen="time"; app.paid=false; render();
  } else if(a==="toPick"){ app.screen="pick"; render(); }
  else if(a==="hours"){ app.hours=+t.dataset.h; render(); }
  else if(a==="toPay"){ app.screen="pay"; app.paid=false; render(); }
  else if(a==="simPay"){
    app.paid=true; render();
    later(function(){ app.screen="verify"; render(); },900);
  } else if(a==="sendCode"){
    var v=document.getElementById("ph").value;
    if(v.replace(/\D/g,"").length<10){ setErr("Enter a valid mobile number."); return; }
    app.phone=v.trim(); app.codeSent=true; app.attempts=0; render();
    var c=document.getElementById("cd"); if(c) c.focus();
  } else if(a==="resend"){ app.codeSent=false; render(); }
  else if(a==="verify"){
    var code=document.getElementById("cd").value.trim();
    if(!/^\d{6}$/.test(code)){ setErr("Enter the 6-digit code."); return; }
    if(code!==TEST_CODE){
      app.attempts++;
      if(app.attempts>=3){ app.codeSent=false; app.attempts=0; render(); setErr("Too many wrong codes. Request a new one."); }
      else setErr("That code isn’t right. Try again ("+app.attempts+" of 3).");
      return;
    }
    startOpening();
  } else if(a==="closed"){
    lockers[app.locker]="used"; app.phase="running";
    statusText.textContent="Locker "+app.locker+" is locked and in use.";
    render();
  } else if(a==="addHour"){
    app.endAt+=3600000; app.hours+=1; app.note="1 hour added for "+money(PRICE)+" (test mode)."; render();
  } else if(a==="collect"){
    lockers[app.locker]="open"; app.phase="collecting"; app.note="";
    statusText.textContent="Locker "+app.locker+" is open for collection.";
    render();
  } else if(a==="taken"){
    var done=app.locker, paid=app.hours*PRICE;
    clearAll(); fresh();
    app.notice="Rental ended. Locker "+done+" is free again. Paid "+money(paid)+" (test mode).";
    statusText.textContent="Locker "+done+" is free again.";
    render();
  } else if(a==="again"){ clearAll(); fresh(); statusText.textContent=DEFAULT_STATUS; render(); }
});
screen.addEventListener("input",function(){ setErr(""); });
screen.addEventListener("keydown",function(e){
  if(e.key==="Enter" && e.target.tagName==="INPUT"){ var b=screen.querySelector(".btn.full"); if(b) b.click(); }
});

cells.forEach(function(cell){
  cell.querySelector(".door").addEventListener("click",function(){
    var n=+cell.dataset.n;
    if(lockers[n]==="used"){ statusText.textContent="Locker "+n+" is in use."; return; }
    if((app.screen==="opening"||app.screen==="active") && n===app.locker) return;
    var open=lockers[n]!=="open";
    lockers[n]=open?"open":"free";
    if(app.screen==="pick"||app.screen==="time"){ app.locker=n; render(); } else { paintHero(); }
    statusText.textContent=open
      ? "Locker "+n+" open. Door sensor confirmed. Real lockers only open after payment and a one-time code."
      : "Locker "+n+" closed. The sensor confirms the door is shut.";
  });
});
rentSel.addEventListener("click",function(){
  if(app.locker && (app.screen==="pick"||app.screen==="time")){ app.screen="time"; render(); }
  location.hash="#/rent";
});
document.getElementById("reset").addEventListener("click",function(){ clearAll(); fresh(); statusText.textContent=DEFAULT_STATUS; render(); });

var hours=document.getElementById("hours");
var total=document.getElementById("total");
var hoursText=document.getElementById("hoursText");
var endText=document.getElementById("endText");
function updateCalc(){
  var h=parseInt(hours.value,10);
  total.textContent=money(h*PRICE);
  hoursText.textContent=hrs(h);
  document.getElementById("rentHours").textContent="Rent for "+hrs(h);
  endText.textContent=endLabel(h);
}
hours.addEventListener("input",updateCalc);
updateCalc();

var menuBtn=document.getElementById("menuBtn"), mnav=document.getElementById("mnav");
function setMenu(open){ mnav.hidden=!open; menuBtn.setAttribute("aria-expanded",open?"true":"false"); menuBtn.setAttribute("aria-label",open?"Close menu":"Open menu"); }
menuBtn.addEventListener("click",function(){ setMenu(mnav.hidden); });
mnav.addEventListener("click",function(e){ if(e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown",function(e){ if(e.key==="Escape" && !mnav.hidden){ setMenu(false); menuBtn.focus(); } });
window.addEventListener("hashchange",function(){ setMenu(false); });

var rentHours=document.getElementById("rentHours");
rentHours.addEventListener("click",function(){
  var h=parseInt(hours.value,10);
  if(app.screen==="pick"||app.screen==="time"){ app.hours=h; if(app.locker) app.screen="time"; render(); }
  location.hash="#/rent";
});

var viewHome=document.getElementById("view-home"), viewRent=document.getElementById("view-rent");
var HOME_TITLE=document.title, homeY=0;
window.addEventListener("scroll",function(){ if(!viewHome.hidden) homeY=window.scrollY; },{passive:true});
function route(initial){
  var rent=location.hash==="#/rent";
  viewHome.hidden=rent; viewRent.hidden=!rent;
  document.title=rent?"Rent a locker | SmartRent PK":HOME_TITLE;
  if(rent){
    if(window.innerWidth<=900) document.getElementById("phone").scrollIntoView(); else window.scrollTo(0,0);
  } else {
    var id=location.hash.slice(1), t=(id && id.charAt(0)!=="/") ? document.getElementById(id) : null;
    if(t) t.scrollIntoView(); else window.scrollTo(0,initial?0:homeY);
  }
}
window.addEventListener("hashchange",function(){ route(false); });
route(true);

fresh(); render();
})();
if(!matchMedia("(prefers-reduced-motion:reduce)").matches){
  document.documentElement.classList.add("js");
  var rv=document.querySelectorAll(".steps li,.facts li,.log,.calc,.uses div,details,.section h2,.find .wrap>*");
  rv.forEach(function(el,i){ el.classList.add("rv"); el.style.setProperty("--d",(i%4)*0.1+"s"); });
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  },{threshold:.15});
  rv.forEach(function(el){ io.observe(el); });

  // doors take turns peeking open until the visitor interacts
  var order=[1,2,4], k=0, demo=setInterval(function(){
    var c=document.querySelector('.cell[data-n="'+order[k++%3]+'"]');
    if(!c||c.classList.contains("open")) return;
    c.classList.add("peek"); setTimeout(function(){ c.classList.remove("peek"); },1100);
  },2600);
  document.querySelector(".cabinet").addEventListener("click",function(){
    clearInterval(demo); document.querySelectorAll(".peek").forEach(function(c){c.classList.remove("peek");});
  },{once:true});
}
(function(){
  var hero=document.querySelector(".hero"); if(!hero) return;
  var bg=document.createElement("div"); bg.className="hero-bg"; bg.setAttribute("aria-hidden","true");
  var grid=document.createElement("div"); grid.className="lk-grid"; bg.appendChild(grid);
  hero.insertBefore(bg,hero.firstChild);
  var cells=[], cols=0, rows=0, STEP=76;

  function build(){
    var w=hero.clientWidth, h=hero.clientHeight; if(w<50) return;
    cols=Math.ceil(w/STEP); rows=Math.ceil(h/STEP);
    grid.style.setProperty("--c",cols); grid.style.setProperty("--r",rows);
    grid.innerHTML=""; cells=[];
    for(var i=0;i<cols*rows;i++){
      var d=document.createElement("div"); d.className="lk"; d.appendChild(document.createElement("i"));
      grid.appendChild(d); cells.push(d);
    }
  }
  function pop(c,ms){
    if(!c||c.classList.contains("on")) return;
    c.classList.add("on"); setTimeout(function(){ c.classList.remove("on"); },ms);
  }
  build();
  var t; window.addEventListener("resize",function(){ clearTimeout(t); t=setTimeout(build,200); });

  if(matchMedia("(prefers-reduced-motion:reduce)").matches) return;

  // random doors opening on their own
  setInterval(function(){
    if(!cells.length||hero.offsetParent===null) return;
    for(var k=0;k<3;k++) pop(cells[Math.floor(Math.random()*cells.length)],1800+Math.random()*1800);
  },500);

  // doors open under the cursor
  hero.addEventListener("pointermove",function(e){
    var r=hero.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
    hero.style.setProperty("--mx",x+"px"); hero.style.setProperty("--my",y+"px");
    bg.style.setProperty("--mx",x+"px"); bg.style.setProperty("--my",y+"px");
    var c=Math.floor(x/(r.width/cols)), rw=Math.floor(y/(r.height/rows));
    pop(cells[rw*cols+c],1400);
  });
})();
(function(){
  // wrap the brand text so it can be animated separately from the logo
  document.querySelectorAll(".brand,.rentbrand").forEach(function(b){
    Array.prototype.slice.call(b.childNodes).forEach(function(n){
      if(n.nodeType===3 && n.textContent.trim()){
        var s=document.createElement("span"); s.className="brand-t"; s.textContent=n.textContent.trim();
        b.replaceChild(s,n);
      }
    });
  });
  // shrink the navbar and add a shadow once the page scrolls
  var nav=document.querySelector(".nav");
  function onScroll(){ if(nav) nav.classList.toggle("scrolled",window.scrollY>12); }
  window.addEventListener("scroll",onScroll,{passive:true}); onScroll();
})();
`;

export default function Page() {
  const booted = useRef(false);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || booted.current) return;

    booted.current = true;

    const run = () => {
      try {
        new Function(ORIGINAL_SCRIPT)();
      } catch (error) {
        console.error("SmartRent prototype boot error:", error);
      }
    };

    const frame = requestAnimationFrame(run);

    return () => cancelAnimationFrame(frame);
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: ORIGINAL_BODY,
      }}
    />
  );
}