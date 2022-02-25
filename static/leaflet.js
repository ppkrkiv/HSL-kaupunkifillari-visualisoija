"use strict";

/*
Puhdas JS-tiedosto kartalle
TODO: selvitä, voidaanko työntää omatesti.js:ään
*/

//globaali karttamuuttuja, jonka "muotoa muutetaan" karttafunktioissa
var mymap;
var heatmapLayerLahto;
var heatmapLayerMaali;
var pysakit = [];
var nahtavyydet = [];
var top3klikattu = false;
var top3ryhma;
var koti_t = [];


function main() {
    luoKartta();
    luoPysakit();
    luoHeatmapit();
}

// Alustetaan karttapohja
function luoKartta() {
    mymap = L.map('kartta', { zoomControl:false}).setView([60.199, 24.90], 11.7);
    L.tileLayer('https://tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token=bj2AbuxezYbcMJczmwbNfqJtVt69IDaS5asLo3pQLbgtlU7kQpQfm5a8HanhbmWD', {
        maxZoom: 20,
        attribution: "<a href=\"https://www.jawg.io\" target=\"_blank\">&copy; Jawg</a> - <a href=\"https://www.openstreetmap.org\" target=\"_blank\">&copy; OpenStreetMap</a>&nbsp;contributors"
    }).addTo(mymap);

    mymap.on('click', onMapClick);
    //mymap.on('popupclose', asetaMarkerSiniseksi);
    top3ryhma = L.layerGroup().addTo(mymap);

    // lisää dynaamisesti kuuntelijan jokaiselle linkki-luokan elementille kartan sisällä
    $("#kartta").on("click", ".linkki", function() {
        top3klikattu = true;
        let teksti = $( this ).text()
        let asema = teksti.substring(3, teksti.length);
        $("#asemavalinta").val(asema).trigger("input");
    });
}

// Apufunktio asettamaan kaikki punaisella näkyvät "valitut" pysäkit takaisin siniseksi, kun popuppi suljetaan
function asetaMarkerSiniseksi(e) {
    let sininenPallo = L.icon({
        iconUrl: "static/sininen_pallo.png"
    });
    
    for (let i = 0; i < pysakit.length; i++) {
        if (pysakit[i].marker._icon.getAttribute("src") == "static/punainen_pallo.png") {
            pysakit[i].marker.setIcon(sininenPallo);
        }
    }
}

// Apufunktio kumittamaan kartalla olevat piirrustukset
function kumitaPiirrustukset(e) {
    top3ryhma.clearLayers();
    if (koti_t.length != 0) {
        koti_t[1].remove(mymap);
        koti_t.pop();
        mymap.removeLayer(koti_t[0]);
        koti_t.shift();
    }
}

// Tällä saa konsoliin nätisti koordinaatit siitä kohtaa mistä klikkaa
// Funktio tottelee, kun karttaa klikataan.
function onMapClick(e) {
    let lat = e.latlng.lat;
	let lng = e.latlng.lng;
    console.log("lat: " + lat);
    console.log("long: " + lng);
    
    kumitaPiirrustukset();
    asetaMarkerSiniseksi();
}

// About us-toimintoa hauskalla tavalla. Funktio piirtää reitin Jyväskylään ja asettaa Jyväsjärven pohjaan markkerin, joka popupista voi
// lukea about us tietoa ryhmästämme.
function piirraTaiPoistaReittiJyvaskylaan() {
    if (koti_t.length != 0) {
        koti_t[1].remove(mymap);
        koti_t.pop();
        mymap.removeLayer(koti_t[0]);
        koti_t.shift();
    }
    else {
        // Helsingin keskusta:
        let latHKI = 60.17139370518366;
        let lonHKI = 24.94130801263964;
        let latlngHKI = new L.LatLng(latHKI, lonHKI);

        // Agoran osoite:
        let latJKL = 62.23257225532408;
        let lonJKL = 25.737420916557316;
        let latlngJKL = new L.LatLng(latJKL, lonJKL);

        // Taulukko koordinaateista Helsingin ja Jyväskylän välillä
        const koordinaatit_jkl_hki = [
            [
                60.17139370518366,
                24.94130801263964
            ],
            [   62.23257225532408,
                25.737420916557316
            ]
        ];

        // Luodaan markkeri Jyväsjärven pohjaan ja asetetaan siihen About us-tietoa. Lisätään markeri myös globaalin koti_taulukkoon
        // TODO: Popupin tyylittely ja teksti.  
        let markeri_kotiaVarten = new L.Marker(latlngJKL);
        mymap.addLayer(markeri_kotiaVarten);
        //tehty sivulla https://www.gdoctohtml.com/
        // &auml = a umlaut = ä
        // &ouml = o umlaut = ö
        let aboutUsTeksti = "<h2>Kurssin kuvaus:</h2> \
        <span style=\"color: #212529;\">TIEA207-kurssi on Jyväskylän Yliopiston IT-tiedekunnan tietotekniikan opiskelijoille suunnattu aineopintotasoinen projektikurssi, \
        joka perustuu avoimien resurssien (erityisesti data) hy&ouml;dynt&auml;miselle.&nbsp;Kurssi haastaa osallistujat ideoimiaan itse projektiaiheen \
        ja toteuttamaan sen noin 12 viikon aikajaksolla. Kurssin ryhm&auml;t tutkivat avoimesti saatavilla olevia resursseja projektiaiheen ideoimiseksi \
        pohtien samalla projektin kohderyhm&auml;&auml;. Kurssin lopputulema on ryhm&auml;n toteuttama, k&auml;ytett&auml;v&auml; prototyyppi projekti-ideasta.&nbsp;</span>\
        <h2>Projektiryhm&auml;:&nbsp;</h2>\
        <span>Janne Lahti, Joona Laitinen, Karri Kalliala, Pyry K&auml;rki</span>\
        <h2>Projektista:</h2>\
        <h3>Ty&ouml;kalut</h3>\
        <ul>\
            <li>Viestint&auml;v&auml;lineet: Discord, WhatsApp</li>\
            <li>Suunnitteluv&auml;lineet: Framer, Trello</li>\
            <li>Versionhallinta: gitlab.jyu</li>\
            <li>Ohjelmointikielet: Python, JavaScript</li>\
            <li>Kirjastot: Flask, jQuery, Leaflet, Heatmap.js</li>\
            </ul>\
        <h2>Data:&nbsp;</h2>\
        <ul>\
        <li>Kaupunkipy&ouml;rien asemat ja matkat\
        HSL (<a target=\"_blank\" rel=\"noopener noreferrer\" href=\"https://www.hsl.fi/hsl/avoin-data#kaupunkipyorilla-ajetut-matkat\">https://www.hsl.fi/hsl/avoin-data#kaupunkipyorilla-ajetut-matkat</a>)\
        </li>\
        <li>Helsingin n&auml;ht&auml;vyydet\
        MyHelsinki Open API (<a target=\"_blank\" rel=\"noopener noreferrer\" href=\"http://open-api.myhelsinki.fi/\">http://open-api.myhelsinki.fi/</a>)\
        </li>\
        </ul>";
        markeri_kotiaVarten.bindPopup(aboutUsTeksti);
        koti_t.push(markeri_kotiaVarten);
        
        // Asetetaan viivalle Jyväskylään arvot
        var polyline_asetukset = {
            color: 'red',
            weight: 3,
            opacity: 0.5
        };

        // Asetetaan viiva kartalle ja lisätään globaaliin kotimuuttujaan, jossa nyt tallessa marker ja polyline
        var uusiPolyline = new L.polyline(koordinaatit_jkl_hki, polyline_asetukset).addTo(mymap);
        koti_t.push(uusiPolyline);

        // Asemoidaan kartta vielä järkeväksi, jotta jyväskylä hahmottuu paremmin
        mymap.fitBounds(uusiPolyline.getBounds());

    }
}


// Funktio, joka piirtää nähtävyydet kartalle ylhäällä oleva piirtäminen on siirretty tähän
function piirraNahtavyydetKarttaan() {
    for (let i = 0; i < nahtavyydet.length; i++) {
        let marker = nahtavyydet[i].marker;
        marker.addTo(mymap);
    };
}

// Funktio, joka poistaa kartalta sille piirretyt nähtävyydet (markkerit)
function poistaNahtavyydetKartalta() {
    for (let i = 0; i < nahtavyydet.length; i++) {
        let poistettavaMarker = nahtavyydet[i].marker;
        mymap.removeLayer(poistettavaMarker);
    }
}


//tällä haetaan data muuttujaan pysäkkien ID, NIMI, OSOITE, X, Y ja piirretään marker
function luoPysakit() {
    //alustetaan static-kansiosta pallon kuva Leaflet_iconiksi
    var bikeIcon = L.icon({
        iconUrl: "static/sininen_pallo.png",
        iconSize: [9, 9],
        popupAnchor: [0, -6],
    });

    var flagIcon = L.icon({
        iconUrl: "static/redflag.png",
        iconSize: [20, 20],
        popupAnchor: [0, -6],
    });


    // ajaxlla kautta http:GET pyyntö flaskin pystyttämälle serverille. 
    // app.py/asemat - funktio tuo data-muuttujaan pyöräasemien tiedot
    $.ajax({
        data : {},
        type : 'GET',
        url  : '/asemat'
    })
    .done(function(data) {
        //käydään läpi asemat pysäkki kerrallaan. Otetaan jokainen muuttuja käsittelyyn ja tehdään 
        //leafletin dokumentaation mukainen marker niiden avulla ja lisätään se globaaliin mymap - karttaan
        for (const pysakki of data) {
            var ID      = pysakki[0];
            var nimi    = pysakki[1];
            var osoite  = pysakki[2];
            var kapasit = pysakki[3];
            var long    = pysakki[4];
            var lat     = pysakki[5];
            
            var popup = L.popup()
            .setContent("<div><strong>"+nimi+"</strong></br><img src='static/map.png' alt='kuvake' class='kuvake'> Osoite: "+osoite+"</br>"+"<img src='static/fillari.png' alt='kuvake' class='kuvake'> Pyöräpaikkoja: "+kapasit+"</br>"+"Täältä pyöräillään eniten asemille:"+"<br /></div>");
            
            var marker = L.marker([lat, long], {icon: bikeIcon, omaID: ID, kaytetty: false}).addTo(mymap).on('click', markerKlikki);

            pysakit.push({ id: ID, lat: lat, lng: long, marker: marker, name: nimi });
            // markerille on lisätty custom option iconin perään
            // konsolin mukaan onclick on vanhentunut???
            marker.bindPopup(popup);
            //jokaiseen asema-markeriin liitetään Leaflet-popup, joka avautuu määrätyllä tekstisisällöllä
            
        }
    

    $.ajax({
        data : {},
        type : 'GET',
        url  : '/nahtavyydet'
    })
    .done(function(data) {
        for (const nahtavyys of data) {
            let ID = nahtavyys[0];
            let nimi = nahtavyys[1];
            let info_url = nahtavyys[2];
            let kaupOsa = nahtavyys[3];
            let kuvaus = nahtavyys[4];
            let osoite = nahtavyys[5];
            let lat = nahtavyys[6];
            let lon = nahtavyys[7];

            let popup = L.popup()
            .setContent("<div><strong>"+nimi+"</strong></div>")

            let marker = L.marker([lat, lon], {icon: flagIcon, ID: ID}).on('click', nahtavyysKlikki);

            nahtavyydet.push({ id: ID, lat: lat, lng: lon, marker: marker, name: nimi, kuvaus: kuvaus, osoite: osoite, url: info_url, kaupOsa: kaupOsa, kuvaData: haeKuvaData(ID)})
            marker.bindPopup(popup);
        }
    })
    
    });
}


function haeKuvaData(id) {
    for (let kuva of kuvadata.items) {
        if (kuva.id === id) { 
            return kuva;
        }
    }

    //jos ei löydy niin joko tyhjä tai sitten placeholder kuvan url.
    return null;
}

// nähtävyyden klikkaus
function nahtavyysKlikki(e) {
    $("#sidenavButton").trigger( "click" );
    // TODO: hae ja tulosta tiedot kunnolla
    let index = findWithAttr(nahtavyydet, "id", this.options.ID);
    $("#hkiInfo").text(nahtavyydet[index].kuvaus);

    if (nahtavyydet[index].kuvaData) {
        // if kunnes kaikilla on kuvaData
        $("#hkiKuva").attr("src",nahtavyydet[index].kuvaData.kuvaUrl);
        if (nahtavyydet[index].kuvaData.kuvaUrl) {
            let linkki = '<a target="_blank" rel="noopener noreferrer" href=' + nahtavyydet[index].kuvaData.linkki + '>lähde</a>';
            $("#hkiInfo").append("<span>Kuva: " + nahtavyydet[index].kuvaData.valokuvaaja + " / " + linkki + "</span>");
        }
    }    
}

function markerKlikki(e) {
    asetaMarkerSiniseksi();
    var uusi_ikoni = L.icon({
        iconUrl: "static/punainen_pallo.png"
    });
    this.setIcon(uusi_ikoni);
    //värjätään ikoni punaiseksi klikatessa

    let popuppi = this._popup;

    //jos markeria on jo klikattu aiemmin, tehdään pelkästään polylinet
    if (this.options.kaytetty) { 
        let omaIndex = findWithAttr(pysakit, "id", this.options.omaID);
        $.ajax({
            data : {},
            type : 'GET',
            url  : '/top3asemat/' + this.options.omaID,
            success: function(data) {
                top3ryhma.clearLayers();
                for (let i = 0; i < data.length; i++) {
                    let index = findWithAttr(pysakit, "id", data[i][0]);
                    let numero = "" + (i+1);
                    let koordit = [[pysakit[omaIndex].lat, pysakit[omaIndex].lng], [pysakit[index].lat, pysakit[index].lng]]; 
                    L.polyline(koordit, {color: 'cyan', opacity: 0.5}).bindTooltip(numero, {
                        // osa tyyleistä on css-luokassa
                        permanent: true, direction:"center", className: "tooltip"
                    }).openTooltip().addTo(top3ryhma);
                }
            }
        });
    }

    //jos markeria ei vielä ole klikattu kertaakaan, tehdään sekä asemalinkit että polylinet
    else { 
        this.options.kaytetty = true; //nyt on klikattu kerran
        let string = popuppi.getContent();
        popuppi.setContent(string + "<span class='pisteet'>Ladataan</span>");
        let omaIndex = findWithAttr(pysakit, "id", this.options.omaID);
        $.ajax({
            data : {},
            type : 'GET',
            url  : '/top3asemat/' + this.options.omaID,
            success: function(data) {
                top3ryhma.clearLayers();
                for (let i = 0; i < data.length; i++) {
                    let index = findWithAttr(pysakit, "id", data[i][0]);
                    let nimi = pysakit[index].name;
                    string += "<span class='linkki'>" + (i+1) + ". " + nimi + "</span>";

                    let numero = "" + (i+1);
                    let koordit = [[pysakit[omaIndex].lat, pysakit[omaIndex].lng], [pysakit[index].lat, pysakit[index].lng]]; 
                    L.polyline(koordit, {color: 'cyan', opacity: 0.5}).bindTooltip(numero, {
                        // osa tyyleistä on css-luokassa
                        permanent: true, direction:"center", className: "tooltip"
                    }).openTooltip().addTo(top3ryhma);
                }
                popuppi.setContent(string);
            }
        });
    }
}

function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}

function luoHeatmapit() {

    var cfgLahto = { //konfiguraatio kopsattu heatmap.js sivulta
        // radius should be small ONLY if scaleRadius is true (or small radius is intended)
        // if scaleRadius is false it will be the constant radius used in pixels
        "radius": 0.01,
        "maxOpacity": .7,
        // scales the radius based on map zoom
        "scaleRadius": true,
        // if set to false the heatmap uses the global maximum for colorization
        // if activated: uses the data maximum within the current map boundaries
        //   (there will always be a red spot with useLocalExtremas true)
        "useLocalExtrema": true,
        // which field name in your data represents the latitude - default "lat"
        latField: 'lat',
        // which field name in your data represents the longitude - default "lng"
        lngField: 'lng',
        // which field name in your data represents the data value - default "value"
        valueField: 'count',
        gradient: {
            '.5': 'yellow',
            '.8': 'orange',
            '.95': 'red'
        }
    };
    
    var cfgMaali = { 
        "radius": 0.01,
        "maxOpacity": .7,
        "scaleRadius": true,
        "useLocalExtrema": true,
        latField: 'lat',
        lngField: 'lng',
        valueField: 'count',
        gradient: {
            '.5': 'green',
            '.8': 'cyan',
            '.95': 'blue' 
        }
    };

    var Group = L.layerGroup().addTo(mymap);
    heatmapLayerLahto = new HeatmapOverlay(cfgLahto).addTo(Group);
    heatmapLayerLahto._el.style.opacity = "0.8";  

    heatmapLayerMaali = new HeatmapOverlay(cfgMaali).addTo(Group);
    heatmapLayerMaali._el.style.opacity = "0.8";

    //nyt vielä kun on rikki niin sivu näyttää sen layerin kumpi on ekana listassa^^

}


//data muodossa X_STATION_ID...
function muokkaaHeatmap(data, radio, lahto) {
    var lista = [];
    var lahtoData = {
        max: 10,
        data: [],
    };
    var maaliData = {
        max: 10,
        data: [],
    };

    // yks data lähetetään kutsussa. sen perusteella maalataan layeri
    // radioparametri kertoo kumpi layeri. Jos radio = 3 niin sillon ei tyhjennetä toista
    // jos radio = 1 tai 2 niin maalataan sen mukainen layeri ja tyhjennetään toinen.
    for (var pysakki of pysakit) {
        for (var osuma of data) {
            if(osuma[0] === pysakki.id) {
                var hotspot = { lat: pysakki.lat, lng: pysakki.lng, count: osuma[1] };
                lista.push(hotspot);
            }
        }
    }

    if(radio === "1") {
        lahtoData.data = lista;
        //maaliData.data = [];
        heatmapLayerLahto.setData(lahtoData); //jos valittu lähtö, niin lähtödatassa on tavaraa ja maalidata on tyhjä.
        heatmapLayerMaali.setData(maaliData); // tällöin maaliLayer tyhjäytyy ja lähtöLayer täyttyy, ja sama toisinpäin
    }
    else if (radio === "2") {
        maaliData.data = lista;
        //lahtoData.data = [];
        heatmapLayerLahto.setData(lahtoData); 
        heatmapLayerMaali.setData(maaliData); 
    }
    else { //radio === "3"
        if(lahto) { //jos parametrina annettu lähtö on true,
            lahtoData.data = lista;
            heatmapLayerLahto.setData(lahtoData);
        }
        else {
            maaliData.data = lista;
            heatmapLayerMaali.setData(maaliData); 
        }
    }
}

window.onload = () => main();