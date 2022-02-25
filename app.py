from sqlite3.dbapi2 import Cursor
from flask import Flask, render_template, request, jsonify
from random import randint
import csv
import sqlite3
import json
app = Flask(__name__)
app.debug = True

@app.route("/")
def joku():
    return render_template("index.html")

'''
@app.route('/_add_numbers')
def add_numbers():
    a = request.args.get('a', 0, type=int)
    b = request.args.get('b', 0, type=int)
    return jsonify(result=a + b)
'''

@app.route('/nahtavyydet', methods=['GET'])
def haeNahtavyydet():
    conn = sqlite3.connect('tietokanta.db')
    cursor = conn.execute("SELECT * FROM NAHTAVYYS")
    lista = []
    for row in cursor:
        lista.append(row)
    cursor.close()
    conn.close()
    return jsonify(lista)

#
#täältä saa apua sqliten operaattoreiden käyttöä varten
#https://www.tutorialspoint.com/sqlite/sqlite_operators.htm
#tarvitaan myöhäisemmässä vaiheessa
#
@app.route('/asemat', methods=['GET'])
def haeTietokannasta():
    conn = sqlite3.connect('tietokanta.db')
    cursor = conn.execute("SELECT ID, NIMI, OSOITE, KAPASITEETTI, X, Y FROM ASEMA")
    lista = []
    for row in cursor:
        lista.append(row)
    cursor.close()
    conn.close()
    return jsonify(lista)


# funktio jolla haetaan yhden aseman top3 päätepysäkit
# EI TOIMI VIELÄ
@app.route('/top3asemat/<id>', methods=['GET'])
def haeTop3(id):
    conn = sqlite3.connect('tietokanta.db')
    lista = []
    cursor = conn.execute('''
            SELECT RETURN_STATION_ID
            FROM MATKA 
            WHERE DEPARTURE_STATION_ID = ''' + id + ''' 
            AND DISTANCE_METERS > 200
            AND DURATION_SEC > 120
            GROUP BY RETURN_STATION_ID 
            ORDER BY COUNT(*) DESC
            LIMIT 3;    ''')
    for row in cursor:
        lista.append(row)
    cursor.close()
    conn.close()
    return jsonify(lista)

@app.route('/haematkoja', methods=['GET'])
def haeMatkoja():
    conn = sqlite3.connect('tietokanta.db')
    cursor = conn.execute("SELECT * FROM MATKA WHERE DISTANCE_METERS > 200 \
                           AND DURATION_SEC > 120 LIMIT 25;")
    lista = []
    for row in cursor:
        lista.append(row)
    cursor.close()
    conn.close()
    return jsonify(lista)

# hakee kaikkien asemien nimet mutta ei muita sarakkeita
@app.route('/haeNimet', methods=['GET'])
def haeNimet():
    conn = sqlite3.connect('tietokanta.db')
    cursor = conn.execute("SELECT NIMI FROM ASEMA ORDER BY NIMI")
    lista = []
    for row in cursor:
        lista.append(row[0])
    cursor.close()
    conn.close()
    return jsonify(lista)

# hakee nimen perusteella yhden aseman kaikki tiedot 
@app.route('/haeNimella/', methods=['GET'])
def haeNimella():
    nimi = request.args.get('nimi')
    conn = sqlite3.connect('tietokanta.db')
    cursor = conn.execute("SELECT * FROM ASEMA WHERE NIMI = '" + nimi + "';")
    lista = []
    for row in cursor:
        lista.append(row)
    cursor.close()
    conn.close()
    return jsonify(lista)

#
# @app.routeen laitetaan "url", jonka kautta flask-serveri tietää hakea urlin mukaisen funktion. 
# esimerkkejä : '/yhdelläparametrilla/<parametri>'          '/kahdellaparametrilla/<eka>/<toka>' 
#
# GET	The most common method. A GET message is send, and the server returns data
# POST	Used to send HTML form data to the server. The data received by the POST method is not cached by the server.
@app.route('/haematkaparam/<id>', methods=['GET'])
def haeMatkaParam(id):
    #yhdistetään conn muuttuja tietokantaan
    conn = sqlite3.connect('tietokanta.db') 

    #tässä muokattava sql-lause, hakee parametrina annetun lähtöaseman matkatiedot
    sqlLause = "SELECT * FROM MATKA WHERE DEPARTURE_STATION_ID = " + id + " \
                AND DISTANCE_METERS > 200 \
                AND DURATION_SEC > 120 LIMIT 25;" 

    #suoritetaan sql-kysely, jonka tulos tallennetaan muuttujaan
    cursor = conn.execute(sqlLause)
    lista = []
    for row in cursor:          #viedään SQL-kyselyn tulokset perus listamuotoon.
        lista.append(row)
    cursor.close()
    conn.close()                #suljetaan sql-kysely, sekä sqlite yhteys.
    return jsonify(lista)       #palautetaan lista json-muodossa

@app.route('/haesummaparam/<id>')
def haeSummaParam(id):
    conn = sqlite3.connect('tietokanta.db') 

    sqlLause = "SELECT SUM(DISTANCE_METERS), SUM(DURATION_SEC) FROM MATKA \
                WHERE DEPARTURE_STATION_ID = " + id + " AND DISTANCE_METERS > 200 \
                AND DURATION_SEC > 120;"

    cursor = conn.execute(sqlLause)
    lista = []
    for row in cursor:  
        lista.append(row)
    cursor.close()
    conn.close()           
    return jsonify(lista)

'''
Hetken vielä tallessa, voi mahdollisesti poistaa myöhemmin !!

## Haetaan pvm-parametrin avulla tietoa kannasta
@app.route('/haepvmparam/<id>')
def haePvmParam(id):
    ##pvmTaulussa = id.split('-')
    ##paiva    = pvmTaulussa[0]
    ##kuukausi = pvmTaulussa[1]
    ##vuosi    = pvmTaulussa[2]
    alku = id +"T00:00:00"
    loppu = id + "T23:59:59"
    
    conn = sqlite3.connect('tietokanta.db')
    sqlLause = "SELECT DEPARTURE_STATION_NAME, RETURN_STATION_NAME, DISTANCE_METERS FROM MATKA WHERE DEPARTURE_TIME BETWEEN '" + alku + "' AND '" + loppu + "' LIMIT 10"
    cursor = conn.execute(sqlLause)
    lista = []
    for row in cursor:
        lista.append(row)
    cursor.close()
    conn.close()
    return jsonify(lista)
'''

## Funktio, joka ottaa vastaan alku ja loppupisteen, minkä välinen tietokannan data palautetaan
def haeAlullaJaLopulla(alku, loppu, radio):
    conn = sqlite3.connect('tietokanta.db')
    valinnat = ["DEPARTURE", "RETURN"]
    radio = int(radio)
    sqlLause = "SELECT " + valinnat[radio - 1] + "_STATION_ID, \
                COUNT(" + valinnat[radio - 1] + "_STATION_ID), \
                SUM(DISTANCE_METERS), SUM(DURATION_SEC) FROM MATKA \
                WHERE DEPARTURE_TIME BETWEEN '" + alku + "' AND '" + loppu + "' \
                AND DISTANCE_METERS > 200 AND DURATION_SEC > 120 \
                GROUP BY " + valinnat[radio - 1] + "_STATION_ID;"
        #Jos valittuna on "lähtö" tai "maali" niin palautetaan sen mukaan joko lähtö- tai 
        # maaliaseman matkoja. Valinnat[radio - 1] on joko "DEPARTURE" tai "RETURN" riippuen 
        # siitä, kumman käyttäjä valitsee. Esim radio=1 --> SELECT DEPARTURE_STATION_ID .... 
    cursor = conn.execute(sqlLause)
    lista = []
    for row in cursor:
        lista.append(row)
    cursor.close()
    conn.close()
    return lista

## Funktio, joka hakee vuosiluvun mukaan kannasta. Funktio ottaa vastaan YYYY -tyyppisen vuosiluvun ja tällä hakee
## Kannasta kauden kaikki matkat
## Limitteri 10 _VIELÄ_ koska dataa on paljon.
##
## TODO: tarkempi filtteröinti, hyväksyttävät matkat? Tällä hetkellä palautetaan kaikki matkat
##
def haeVuodella(vuosi, radio):

    alku  = vuosi + "-04-01" + "T00:00:00" 
    loppu = vuosi + "-10-31" + "T23:59:59"

    return haeAlullaJaLopulla(alku, loppu, radio)

## Funktio, joka hakee kuukauden mukaan kannasta
def haeKuukaudella(kuukausi, vuosi, radio):
    
    kkpituudet = [0,31,28,31,30,31,30,31,31,30,31,30,31]
    paivienMaaraTassaKuussa = kkpituudet[int(kuukausi)]

    if int(kuukausi) < 10 :
        kuukausiOikeassaMuodossa = str(kuukausi).zfill(2)
    else : kuukausiOikeassaMuodossa = kuukausi

    alku  = vuosi + '-' + kuukausiOikeassaMuodossa + '-01T00:00:00'
    loppu = vuosi + '-' + kuukausiOikeassaMuodossa + '-' + str(paivienMaaraTassaKuussa) + 'T23:59:59'

    return haeAlullaJaLopulla(alku, loppu, radio)
    

## Funktio, joka hakee paivamaaran mukaan kannasta, tarkin hakufunktio.
## Funktio osaa muuttaa saatuja kuukausia ja päiviä tuplaintegereiksi ( 1 -> 01, 2 -> 02, jne.)
def haePaivalla(paiva, kuukausi, vuosi, radio):
    
    if int(kuukausi) < 10 :
        kuukausiOikeassaMuodossa = str(kuukausi).zfill(2)
    else : kuukausiOikeassaMuodossa = kuukausi

    if int(paiva) < 10 :
        paivaOikeassaMuodossa = str(paiva).zfill(2)
    else : paivaOikeassaMuodossa = paiva

    alku  = vuosi + '-' + kuukausiOikeassaMuodossa + '-' + paivaOikeassaMuodossa + "T00:00:00"
    loppu = vuosi + '-' + kuukausiOikeassaMuodossa + '-' + paivaOikeassaMuodossa + "T23:59:59"

    
    return haeAlullaJaLopulla(alku, loppu, radio)


## Funktio joka osaa nyt hakea kannasta tarvittavaa tietoa päivämäärän mukaan, olipa tuotuna kausi, kuukausi
## tai päivä tai jokin näiden kombinaatio. Päivämäärä haetaan argumenteista. Jos argumenttien kautta ei tule tarpeeksi
## informaatiota ohjelma ei kaadu vaan toimii halutulla tavalla, joka on:
## -
## -
## -
@app.route('/haeAjankohdanMukaan/', methods=['GET'])
def haeAjankohdanMukaan():
    
    kausi = request.args.get('vuosi')
    kuukausi = request.args.get('kuukausi')
    paiva = request.args.get('paiva')
    radio = request.args.get('radio')
    tulos = [[], [], [], []]
    if radio == "1" or radio == "3":
        if paiva == "0" :
            if kuukausi == "0" :
                tulos[0] = haeVuodella(kausi, "1")
            else : tulos[0] = haeKuukaudella(kuukausi, kausi, "1")
        else : tulos[0] = haePaivalla(paiva, kuukausi, kausi, "1")
        
    
    if radio == "2" or radio == "3":
        if paiva == "0" :
            if kuukausi == "0" :
                tulos[1] = haeVuodella(kausi, "2")
            else : tulos[1] = haeKuukaudella(kuukausi, kausi, "2")
        else :tulos[1] = haePaivalla(paiva, kuukausi, kausi, "2")
    

    tulos[2] = haeSakot(kausi, kuukausi, paiva)


    return jsonify(tulos)

#hakee sakot lukumääränä
def haeSakot(kausi, kuukausi, paiva):
    pvm = ''
    if kuukausi == '0' and paiva == '0':
        pvm = kausi + '%'
    elif kuukausi != '0' and paiva == '0':
        pvm = kausi + '-' + kuukausi.zfill(2) + '%'
    else:
        pvm = kausi + '-' + kuukausi.zfill(2) + '-' + paiva.zfill(2) + '%'
    print(pvm)
    conn = sqlite3.connect('tietokanta.db')
    lause = 'SELECT COUNT(*) FROM MATKA \
             WHERE DEPARTURE_TIME LIKE(?) \
             AND RETURN_TIME LIKE(?) \
             AND DURATION_SEC BETWEEN 18000 AND 36000;' #välillä 5-10h
    cursor = conn.execute(lause,(pvm,pvm))
    tulos = []
    for row in cursor.fetchall():
        tulos.append(row)
    cursor.close()
    conn.close()
    return tulos

'''
def tapahtumaHaku(kausi, kuukausi, paiva):
    pvm = ''
    if kuukausi == '0' and paiva == '0':
        pvm = kausi + '%'
    elif kuukausi != '0' and paiva == '0':
        pvm = kausi + '-' + kuukausi.zfill(2) + '%'
    else:
        pvm = kausi + '-' + kuukausi.zfill(2) + '-' + paiva.zfill(2) + '%'
    print(pvm)
    conn = sqlite3.connect('tietokanta.db')
    lause = 'SELECT * FROM TAPAHTUMA WHERE ALOITUS_PVM LIKE(?);'
    cursor = conn.execute(lause,(pvm,))
    tulos = []
    for row in cursor.fetchall():
        tulos.append(row)
    cursor.close()
    conn.close()
    return tulos
'''