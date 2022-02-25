$(document).ready(function() {

    /*
    $(function() {
        $('a#calculate').bind('click', function() {
          $.getJSON('/_add_numbers', {
            a: $('input[name="a"]').val(),
            b: $('input[name="b"]').val()
          }, function(data) {
            $("#result").text(data.result);
          });
          return false;
        });
      });
      */
      $(".radiolabel").click(function() {
            $(this).find('input[type="radio"]').prop('checked', true);
            
            $('.valittuRadio').toggleClass('valittuRadio');    
            $(this).toggleClass('valittuRadio');

            console.log($('input[name=radiovalinta]:checked').val());
      });
      // Kartan oikeasta yläkulmasta löytyvä button, joka esittelee about us-toiminnon
      $("#aboutUs_button").click(function() {
        piirraTaiPoistaReittiJyvaskylaan();
      });

      $("#switch_valinta").prop('checked', false);
      $("#switch_valinta").click(function() {
          if (this.checked) {
              //Checkbox == ON
              piirraNahtavyydetKarttaan();
          }
          else {
              //Checkbox == OFF
              poistaNahtavyydetKartalta();
          }
      });

      // Help-apu
      $("#infoApua").hover(function() {
        $("#popup").css({'opacity':'1', 'z-index':'6'});
      }, function() {
          $("#popup").css({'opacity':'0', 'z-index':'-1'});
      });

    $("#testiButtonPvm").click(function() {
        $("#testiButtonPvm").attr("disabled",true);
        $(".loader").show();
        $.ajax ({
            data : {vuosi: $("#vvselect").val(), kuukausi: $("#kkselect").val(), paiva: $("#pvselect").val(), radio: $('input[name=radiovalinta]:checked').val()},
            type : 'GET',
            url : '/haeAjankohdanMukaan/',
        
            success: function(data) {
                if (top3ryhma) {
                    top3ryhma.clearLayers();
                }
                //console.log(data);
                //palauttaa [yht kilometrejä, keskimääräinen km per matka, yht tunnit]
                //kilometrit[0] = kilometrejä yhteensä ajalta
                //kilometrit[1] = keskimääräinen kilometrimäärä per matka
                //kilometrit[2] = tunteja ajettu yhteensä tältä ajalta
                //kilometrit[3] = matkoja yhteensä
                //kilometrit[4] = keskinopeus
 
                let radio = $('input[name=radiovalinta]:checked').val();
                let kilometrit;
                //jos lähtö -> data[0] on täynnä, data[1] on tyhjä
                //jos maali -> data[0] on tyhjä, data[1] on täynnä
                //molemmat  -> data[0] on täynnä, data[1] on täynnä
                if(radio === "3") {
                    muokkaaHeatmap(data[0], radio, true);
                    muokkaaHeatmap(data[1], radio, false);
                    kilometrit = haeKilometrit(data[0]);
                }
                else {
                    muokkaaHeatmap(data[radio - 1], radio, false);
                    kilometrit = haeKilometrit(data[radio - 1]);
                }

                let pvm = "";
                let pv = $("#pvselect").val();
                let kk =  $("#kkselect").val();
                let vv = $("#vvselect").val();
                if (kk === "0") {
                    pvm = "Ajankohta: \r\n" + vv;
                }
                else if (pv == "0") {
                    pvm = "Ajankohta: \r\n" + kk + "." + vv;
                }
                else {
                    pvm = "Ajankohta: \r\n" + pv + "." + kk + "." + vv;
                }
                
                $("#infoPvm").text(pvm);
                $("#infoMkpl").text(`Matkoja yhteensä: \r\n ${kilometrit[3].toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} kpl`);
                $("#infoKnop").text(`Keskinopeus: \r\n ${kilometrit[4]} km/h`);
                $("#infoKmyht").text(`Kilometrejä yhteensä: \r\n ${kilometrit[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} km`);
                $("#infoTyht").text(`Tunteja yhteensä: \r\n ${kilometrit[2].toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} h`);
                
                let maara = data[2][0][0];
                console.log(maara);
                $("#infoSak").text(`Sakkoja yhteensä: \r\n ${maara} kpl`);
                    
                console.log(data); 
                for (let event of data[3]) {
                    let id =            event[0]; // tyyliä espoo:186449
                    let nimi =          event[1];
                    let infourl =       event[2]; // usein null
                    let kuvaus =        event[3];
                    let pidempikuvaus = event[4]; // tyyliä <p> .... </br> </p>
                    let osoite =        event[5];
                    let aloitusaika =   event[6];
                    let lopetusaika =   event[7];
                    let lat =           event[8]; //numeroina, ei stringejä
                    let lon =           event[9]; // ^^
                    let button = $('<button/>').text(kuvaus);
                }
                    
                //haeTapahtuma();
                $(".loader").hide();
                $("#testiButtonPvm").removeAttr("disabled");
            },
        });
    });


    $("#matka").click(function() {
        $.ajax({
            data : {},
            type : 'GET',
            url  : '/haematkoja'
        })
        .done(function(data) {
            console.log(data);
        });
    });


    //JQueryllä haetaan html-id:n mukainen objekti ja liitetään siihen jqueryn clickfunktio
    $("#matkabutton").click(function() {
        //clickfunktio suorittaa ajaxilla urlin mukaisen http:GET requestin
        $.ajax({
            data : {},
            type : 'GET',
            url  : '/haematkaparam/' + $("#matkateksti").val(),
            // ^^ -> GET /haematkaparam/523 -> app.py funktio haematkaparam(523) joka palauttaa 
            // tiedot data-muuttujaan returnilla
            success: function(data) {
                console.log(data);
            },
        });
    });

    // Käsitellään hakua päivämäärän mukaan matkoille, käyttäjän antama päivämäärä luetaan syötteestä
    // ja haetaan tämän ajankohdan matkoja.
    $("#pvmHakuButton").click(function() {
        $.ajax({
            data: {},
            type: 'GET',
            url:'/haepvmparam/' + $("#pvm").val(),

            success: function(data) {
                console.log(data)
                /*for (let i=0; i<data.length; i++) {
                    console.log(data[i]);
                }*/
            },
            
        });
    });

    /**
     *sivupalkin avaamiseen ja sulkemiseen 
     *periaatteessa siis tekee muutoksen tyyliin
     *TODO: aseta sopiva koko
     */
    $("#sidenavButton").click(function() {
        document.getElementById("mySidenav").style.width = "26vw";
        document.getElementById("infopalkki").style.width = "74vw";
        //document.getElementsByClassName("infoLi").style.padding = "1px";
    });

    $("#closeSidebar").click(function() {
        document.getElementById("mySidenav").style.width = "0";
        document.getElementById("infopalkki").style.width = "100vw";
        //document.getElementsByClassName("infoLi").style.padding = "15px";
    });

    /**
     * valinnoille tarkoitettu toiminto
     * avaa ja sulkee valinnan
     * src:https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_collapsible_symbol <- lahtonen ei tykkäis
     *     
     */
    $(".collapsiple").click(function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight){
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + "px";
        }
    });
    // vuosi valintojen luominen TODO: datan perusteella
    for (let i = 2017; i <= 2021; i++) {
        $("#vvselect").append($("<option>" + i + "</option>"));
    }
    // aputaulukko kuukauden päivien lukumäärille
    var kkpituudet = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    var kuukaudenNimet = ["Tyhja", "Tammikuu", "Helmikuu", "Maaliskuu", 
                        "Huhtikuu", "Toukokuu", "Kesäkuu", "Heinäkuu", 
                        "Elokuu", "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu"];
                        
    $("#kkselect").append($("<option>" + "--kuukausi--" + "</option>").val(0));
    for (let i = 5; i <= 10; i++) {
        $("#kkselect").append($("<option>" + kuukaudenNimet[i] + "</option>").val(i));
    }

    
    // eventlistener kun vuosi valitaan
    $("#vvselect").on("change", function() {
        let vuosiLuku = $(this).val(); 
        console.log(vuosiLuku);
        
        $("#kkselect").empty();
        $("#pvselect").empty();
        $("#pvselect").hide();

        $("#kkselect").append($("<option>" + "--kuukausi--" + "</option>").val(0));
        $("#pvselect").append($("<option>" + "--päivä--" + "</option>").val(0));
        let aloitusKuukausi = 5;
        if (vuosiLuku > 2017) {
            aloitusKuukausi = 4;
        }
        
        $("kkselect").show();
        for (let i = aloitusKuukausi; i <= 10; i++) {
            $("#kkselect").append($("<option>" + kuukaudenNimet[i] + "</option>").val(i));
        }
    });

    // eventlistener kun kuukausi valitaan
    $("#kkselect").on("change", function() {
        let arvo = $(this).val();
        console.log(arvo);
        $("#pvselect").empty();
        $("#pvselect").append($("<option>" + "--päivä--" + "</option>").val(0));
        if (arvo > 0) {
            $("#pvselect").show();
            for (let i = 1; i <= kkpituudet[arvo]; i++) {
                $("#pvselect").append($("<option>" + i + "</option>"));
            }
        } else {
            $("#pvselect").hide();
        }
        console.log("pv: " + $("#pvselect").val() + " KK: " + arvo + " vv: " + $("#vvselect").val());
    });
    // eventlistener kun päivämäärä valitaan
    $("#pvselect").on("change", function() {
        console.log("PV: " + $(this).val() + " kk: " + $("#kkselect").val() + " vv: " + $("#vvselect").val());
    });
    // radiobuttonien käsitely
    $("input[type=radio]").click(function() {
        console.log($(this).val());
    });
    // hakee asemien nimet hakukenttään
    let nimet = [];
    $.ajax({
        data : {},
        type : 'GET',
        url  : '/haeNimet'
    })
    .done(function(data) {
        for (const nimi of data) {
            nimet.push(nimi);  // backend on sortannut valmiiksi aakkosiin
            $("#asemalista").append($("<option>" + nimi + "</option>"));
        }
    });
    // eventlistener kun hakukenttään kirjoitetaan merkkejä
    $("#asemavalinta").on("input", function() {
        let hakusana = $(this).val();        
        if (nimet.includes(hakusana)) {
            $.ajax({
                data : {nimi: hakusana},
                type : 'GET',
                url  : '/haeNimella',
                success: function(data) {
                    if (top3klikattu) {
                        //mymap.setView([data[0][7], data[0][6]], 12 , { animate : "true" });
                    } else {
                        mymap.setView([data[0][7], data[0][6]], 14 , { animate : "true" });
                    }
                    // zoomaa markeriin tehty ja 
                    //laita tiedot näytölle(tulostusalue?) konsolin sijaan
                    top3klikattu = false;
                    for (let pysakki of pysakit) {
                        if(pysakki.id === data[0][0]) {
                            if (pysakki.marker.isPopupOpen()) {
                                return;
                            }
                            asetaMarkerSiniseksi();
                            pysakki.marker.fire("click");
                            return;
                        }
                    }
                }
            });
        }
    });
});


function haeKilometrit(data) {
    let kilometrit = 0;
    let matkat = 0;
    let sekunnit = 0;
    for (let matka of data) {
        matkat += matka[1];
        kilometrit += matka[2];
        sekunnit += matka[3];
    }
    tunnit = Math.round(sekunnit / 3600);
    kilometrit = Math.round(kilometrit / 1000);
    keskimaara = Math.round(kilometrit / matkat);
    keskinopeus = (kilometrit / tunnit).toFixed(2);
    return [kilometrit, keskimaara, tunnit, matkat, keskinopeus];
}





