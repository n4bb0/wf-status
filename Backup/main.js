let platform = 'pc';
//let url = 'https://api.warframestat.us/' + platform; // live
//let url = 'http://127.0.0.1:3000/website/wf-status/baro-example.json'; // baro ki'teer on pc example
let url = 'http://127.0.0.1:3000/website/wf-status/example-' + platform + '.json'; //pc only example
let status;


//unit of measurement is ms
let _second = 1000;
let _minute = _second*60;
let _hour = _minute*60;
let _day = _hour*24;
let _week = _day*7;


// calculates how much time passed since the news
function newsDate(date){
  let start = new Date(date).getTime();
  let now = new Date().getTime();
  let msPassed = now - start;

  let nDays = Math.floor(msPassed / _day);
  let nHours = Math.floor((msPassed % _day) / _hour);
  let nMinutes = Math.floor((msPassed % _hour) / _minute);

  if (nDays) {
    return nDays + 'd';
  } else if (nHours) {
    return nHours + 'h';
  } else {
    return nMinutes + 'm';
  }
}


// display the eta as a countdown; time is the end date, id is the html position where to place the countdown (use css selectors)
function countDown(time, id) {
  let endDate = new Date(time).getTime();

  let timer = setInterval(function(){
    let currentTime = new Date().getTime();
    let distance = endDate - currentTime;

    if (distance < 0) {
      clearInterval(timer);
      $(id).html('Expired!');
      return  //stops the countdown function
    }

    let weeks = Math.floor(distance/_week);
    let days = Math.floor((distance % _week) / _day);
    let hours = Math.floor((distance % _day) / _hour);
    let minutes = Math.floor((distance % _hour) / _minute);
    let seconds = Math.floor((distance % _minute) / _second);

    if (weeks){
      $(id).html(weeks + "w " + days + "d " + hours + "h " + minutes + "m " + seconds + "s");
    } else if (days) {
      $(id).html(days + "d " + hours + "h " + minutes + "m " + seconds + "s");
    } else if (hours) {
      $(id).html(hours + "h " + minutes + "m " + seconds + "s");
    } else if (minutes) {
      $(id).html(minutes + "m " + seconds + "s");
    } else {
      $(id).html(seconds + "s");
    }
  },1000); // end setInterval
}; // end countDown()


// killIntervals() clears any setInterval (and setTimeout) on the page (except update=setInterval(...) ); prevents the countdowns to overlap when the page is updated
// (thanks stackoverflow: https://stackoverflow.com/questions/3141064/how-to-stop-all-timeouts-and-intervals-using-javascript)
// why does it work: each setTimout and setInterval is assigned an id in consecutive integers, so killId has the higher id
function killIntervals(ms){
  let killId = setTimeout(function() {
    for (var i = killId; i > 1; i--) { // i=1 is update=setInterval(...) so i don't want to kill it; to kill everything, even update: i>0
      clearInterval(i);
    }
  }, ms);
}


// draw the circular progress bars in "construction"
function draw(data){
  let fomorianProgress = status.constructionProgress.fomorianProgress;
  let razorbackProgress = status.constructionProgress.razorbackProgress;

  var fomoCanvas = document.getElementById('fomoCanvas');
  var fomoCtx = fomoCanvas.getContext('2d');
  let fomoWidth = fomoCanvas.width = 70;
  let fomoHeight = fomoCanvas.height = 70;

  var razorCanvas = document.getElementById('razorCanvas');
  var razorCtx = razorCanvas.getContext('2d');
  let razorWidth = razorCanvas.width = 70;
  let razorHeight = razorCanvas.height = 70;

  fomoCtx.beginPath();
  fomoCtx.arc(fomoWidth/2, fomoHeight/2, 25, -Math.PI/2, Math.PI*(fomorianProgress-25)/50 /*2*Math.PI*progress/100-Math.PI/2*/); // Outer circle
  fomoCtx.lineWidth = 10;
  fomoCtx.strokeStyle = '#964c3f';
  fomoCtx.stroke();
  $('#fomoId').html(Math.floor(fomorianProgress) + '%');

  razorCtx.beginPath();
  razorCtx.arc(fomoWidth/2, fomoHeight/2, 25, -Math.PI/2, Math.PI*(razorbackProgress-25)/50 /*2*Math.PI*progress/100-Math.PI/2*/); // Outer circle
  razorCtx.lineWidth = 10;
  razorCtx.strokeStyle = '#334768';
  razorCtx.stroke();
  $('#razorId').html(Math.floor(razorbackProgress) + '%');
}


// how does compile() works: 1) it creates or removes spaces if necessary; 2) it fills those spaces with info taken from status (status will be the json file)
function compile(data) {
  // ---alerts---
  // create spaces
  let lastAlert = $('#alerts ul:last-child').attr('id');
  let alertsCount;
  if (lastAlert === undefined) {
    alertsCount = 0;
  }
  else {
    alertsCount = Number(lastAlert.slice(5)) + 1;
  }
  if (alertsCount < status.alerts.length) {
    for (let i = alertsCount; i < status.alerts.length; i++) {
      $('#alerts').append('<ul id="alert' + i + '"></ul>')
      $('#alert' + i).append('<li class="alertInfo"></li>'
                              + '<li class="alertReward"></li>')
    }
  } //end if
  else if (alertsCount > status.alerts.length) {
    for (let i = status.alerts.length; i < alertsCount; i++){
      $('#alert' + i).remove();
    }
  } //end else if

  // compile spaces
  $('#alerts p span').text(status.alerts.length);
  for (let i = 0; i < status.alerts.length; i++) {
    $('#alert' + i + ' .alertInfo').html('<span>' + status.alerts[i].mission.node + '</span> | <span>' + status.alerts[i].mission.type + '</span> | <span>' + status.alerts[i].mission.faction + '</span> level <span>' + status.alerts[i].mission.minEnemyLevel + '</span>-<span>' + status.alerts[i].mission.maxEnemyLevel + '</span>');
    if (status.alerts[i].mission.reward.itemString === "") {
        $('#alert' + i + ' .alertReward').html('<div class="widthLimit"><span class="credits">'+ status.alerts[i].mission.reward.credits +'cr</span></div><span class="time float-right"></span>')
    } else {
      $('#alert' + i + ' .alertReward').html('<div class="widthLimit"><span class="item">' + status.alerts[i].mission.reward.itemString + '</span> + <span class="credits">' + status.alerts[i].mission.reward.credits + 'cr</span></div><span class="time float-right"></span>')
    }
    countDown(status.alerts[i].expiry, '#alert' + i + ' .alertReward .time');
    alertsCount++;
  } // end for
  // ---end alerts---

  // ---invasions---
  // create spaces
  let lastInvasion = $('#invasions ul:last-child').attr('id');
  let invasionsCount;
  let newInvasionsCount = 0;
  if (lastInvasion === undefined) {
    invasionsCount = 0;
  }
  else {
    invasionsCount = Number(lastInvasion.slice(5)) + 1;
  }
  for (let i = 0; i < status.invasions.length; i++) {
    if (status.invasions[i].eta[0] === '-') {
      continue;
    }
    else {
      newInvasionsCount++;
    }
  } //end for
  if (invasionsCount < newInvasionsCount) {
    for (let i = invasionsCount; i < newInvasionsCount; i++) {
      $('#invasions').append('<ul id="invas' + i + '"></ul>')
      $('#invas' + i).append('<li class="invasInfo"></li>'
                             + '<li class="invasReward"></li>'
                             + '<li></li>')
    }
  } //end if
  else if (invasionsCount > newInvasionsCount) {
    for (let i = newInvasionsCount; i < invasionsCount; i++){
      $('#invas' + i).remove();
    }
  } //end else if

  // compile spaces
  let goodInvasionsIndexes = [];
  $('#invasions p span').text(newInvasionsCount);
  for (let i = 0; i < status.invasions.length; i++) {
    if (status.invasions[i].eta[0] === '-') {
      continue;
    }
    else {
      goodInvasionsIndexes.push(i);
    }
  } // end for
  for (let i = 0; i < newInvasionsCount; i++) {
    $('#invas' + i + ' .invasInfo').html('<span>' + status.invasions[goodInvasionsIndexes[i]].node + '</span> | <span>' + status.invasions[goodInvasionsIndexes[i]].attackingFaction + '</span> vs <span>' + status.invasions[goodInvasionsIndexes[i]].defendingFaction + '</span>');
    if (!status.invasions[goodInvasionsIndexes[i]].vsInfestation) {
      $('#invas' + i + ' .invasReward').html('</span>' + status.invasions[goodInvasionsIndexes[i]].attackerReward.asString + '</span> || <span>' + status.invasions[goodInvasionsIndexes[i]].defenderReward.asString + '</span>');
    }
    else {
      $('#invas' + i + ' .invasReward').html('<span>' + status.invasions[goodInvasionsIndexes[i]].defenderReward.asString + '</span>');
    }
    $('#invas' + i + ' li:last-child').html('<span>Ends in (estimated):</span><span class="time float-right">' + status.invasions[goodInvasionsIndexes[i]].eta + '</span>');
  }
  // ---end invasions---

  // ---fissures---
  // create spaces
  let lastFissure = $('#fissures ul li:last-child').attr('id');
  let fissuresCount;
  if (lastFissure === undefined) {
    fissuresCount = 0;
  }
  else {
    fissuresCount = Number(lastFissure.slice(7)) + 1;
  }
  if (fissuresCount < status.fissures.length) {
    for (let i = fissuresCount; i < status.fissures.length; i++) {
      $('#fissures ul').append('<li id="fissure' + i + '"><div class="widthLimit"><span></span> | <span></span> | <span></span></div><span class="time float-right"></span></li>')
    }
  } //end if
  else if (fissuresCount > status.fissures.length) {
    for (let i = status.fissures.length; i < fissuresCount; i++){
      $('#fissure' + i).remove();
    }
  } //end else if

  // compile spaces
  let fissuresOrder = [];
  $('#fissures p span').text(status.fissures.length);
  for (let i = 0; i < status.fissures.length; i++) {
    if (status.fissures[i].tier === 'Lith'){
      fissuresOrder.push(i);
    }
  }
  for (let i = 0; i < status.fissures.length; i++) {
    if (status.fissures[i].tier === 'Meso'){
      fissuresOrder.push(i);
    }
  }
  for (let i = 0; i < status.fissures.length; i++) {
    if (status.fissures[i].tier === 'Neo'){
      fissuresOrder.push(i);
    }
  }
  for (let i = 0; i < status.fissures.length; i++) {
    if (status.fissures[i].tier === 'Axi'){
      fissuresOrder.push(i);
    }
  }

  for (let i = 0; i < fissuresOrder.length; i++) {
    $('#fissure' + i + ' span:first-child').text(status.fissures[fissuresOrder[i]].tier);
    $('#fissure' + i + ' span:nth-child(2)').text(status.fissures[fissuresOrder[i]].missionType);
    $('#fissure' + i + ' span:nth-child(3)').text(status.fissures[fissuresOrder[i]].node);
    countDown(status.fissures[fissuresOrder[i]].expiry, '#fissure' + i + ' .time');
  }
  // ---end fissures---

  // ---sortie---
  //compile spaces
  $('#sortie p span:first-child').text(status.sortie.boss);
  $('#sortie p span:nth-child(2)').text(status.sortie.faction);
  countDown(status.sortie.expiry, '#sortie p .time');
  for (let i = 0; i < 3; i++) {
    $('#sortie' + i + ' li:first-child span').text(status.sortie.variants[i].missionType);
    $('#sortie' + i + ' li:nth-child(2) span').text(status.sortie.variants[i].node);
    $('#sortie' + i + ' li:last-child span').text(status.sortie.variants[i].modifier);
  }
  // ---end sortie---

  // ---baro---
  if (!status.voidTrader.active) {
    $('#voidTrader p').html(status.voidTrader.character + ' | ' + status.voidTrader.location + '<br>Will arrive in: <span class="time float-right"></span>');
    countDown(status.voidTrader.activation, '#voidTrader p .time');
    if ($('#voidTrader div').attr('id') !== undefined) {
      $('#voidTrader div').remove();
    }
  } else if(status.voidTrader.active) {
    $('#voidTrader p').html(status.voidTrader.character + ' | ' + status.voidTrader.location + '<br>Will depart in: <span class="time float-right"></span>');
    countDown(status.voidTrader.expiry, '#voidTrader p .time');
    if ($('#voidTrader div').attr('id') === undefined) {
      $('#voidTrader').append('<div id="voidTraderInventory"></div>');
      $('#voidTraderInventory').append('<button type="button" id="inventoryBtn">Inventory</button>'
                                        + '<div style="display:none"><table><thead><tr><th scope="col">Item</th><th scope="col">Ducats</th><th scope="col">Credits</th></tr></thead><tbody></tbody></table></div>');
      for(let i = 0; i < status.voidTrader.inventory.length; i++) {
        $('#voidTraderInventory table tbody').append('<tr><td>' + status.voidTrader.inventory[i].item + '</td><td>' + status.voidTrader.inventory[i].ducats + '</td><td>' + status.voidTrader.inventory[i].credits + '</td></tr>')
      }
      $('#inventoryBtn').click(function(){
        $('#voidTraderInventory div').stop().slideToggle();
      });
    }
  } // end else if
  // ---end baro---

  // ---darvo---
  $('#darvo ul li:first-child').html('<span>' + status.dailyDeals[0].item + '</span> | stock: ' + (status.dailyDeals[0].total - status.dailyDeals[0].sold) + ' / ' + status.dailyDeals[0].total);
  $('#darvo ul li:last-child').html('Price: ' + status.dailyDeals[0].salePrice + 'p (' + status.dailyDeals[0].discount + '% off) <span class="time float-right"></span>');
  countDown(status.dailyDeals[0].expiry, '#darvo ul li:last-child .time');
  // ---end darvo---

  // ---news---
  // create spaces
  let lastNews = $('#newsList ul li:last-child').attr('id');
  let newsCount;
  if (lastNews === undefined) {
    newsCount = 0;
  }
  else {
    newsCount = Number(lastNews.slice(4)) + 1;
  }
  if (newsCount < status.news.length) {
    for (let i = newsCount; i < status.news.length; i++) {
      $('#news ul').append('<li id="news' + i + '">[<span class="newsDate"></span>] | <span class="newsMessage"><a href="" target="_blank"></a></span></li>')
    }
  } //end if
  else if (newsCount > status.news.length) {
    for (let i = status.news.length; i < newsCount; i++){
      $('#news' + i).remove();
    }
  } //end else if

  // compile spaces
  for (let i = 0; i < status.news.length; i++) {
    $('#news' + i + ' .newsDate').html(newsDate(status.news[status.news.length- 1 - i].date));
    $('#news' + i + ' .newsMessage a').html(status.news[status.news.length- 1 - i].message).attr('href', status.news[status.news.length- 1 - i].link);
  }
  // ---end news---

  // ---cetus---
  if(status.cetusCycle.isDay) {
    $('#cetusTime ul li:first-child').html('<span class="cetusDayNight" id="cetusDay">Day</span>');
    $('#cetusTime ul li:last-child').html('Time until night: <span class="time float-right"></span>');
    countDown(status.cetusCycle.expiry, '#cetusTime .time');
  } else if (!status.cetusCycle.isDay) {
    $('#cetusTime ul li:first-child').html('<span class="cetusDayNight" id="cetusNight">Night</span>');
    $('#cetusTime ul li:last-child').html('Time until day: <span class="time float-right"></span>');
    countDown(status.cetusCycle.expiry, '#cetusTime .time');
  }  //---end cetus---

  // ---constructionProgress---
  draw(status);
  // ---end constructionProgress---
}; //end compile


// show / hide the news
$('#newsBtn').click(function(){
  $('#newsList').stop().slideToggle();
  $(this).text($(this).text() === 'Show News' ? 'Hide News' : 'Show News'); // '? :' it's a conditional (ternary) operator
});


// change platform
$('.platform div').click(function(){
  killIntervals(100);
  $('.platform div').removeClass('platform-active');
  $(this).addClass('platform-active');
  platform = $(this).attr('id');
  //url = 'https://api.warframestat.us/' + platform;
  url = 'http://127.0.0.1:3000/website/wf-status/example-' + platform + '.json';
  update();
});

function update(){
  $.getJSON(url, function(json){
    status = JSON.parse(JSON.stringify(json));
    killIntervals(3000);
    compile(status);
  });
}

update();


// update the informations every 60 seconds (because the json file is updated every 60 seconds)
let everyMinute = setInterval(function(){
  update();
}, 60000); //end setInterval
