var centerer;// = ol.proj.transform([-48.2017747,-21.781757],//[-44.02884352, -19.92260823],//'EPSG:4326', 'EPSG:3857');
var zonas = undefined;
var tiposOcorrencia = undefined;
var categorias = undefined;
sessionStorage.setItem('pesquisa_avancada', '');
sessionStorage.setItem('pesquisa_lote', '');

function getCorStroke(cod_tipo_ocorrencia) {
    if (!tiposOcorrencia)
        return;

    const ret = tiposOcorrencia.find(({ id }) => id === cod_tipo_ocorrencia);
    if (ret)
        return ret.color;
    return '#ff000055';
};

var loteVector = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: function (feature, res) {
        let corStroke = 'rgba(200,200,0)';
        let corFill = 'rgba(200,200,0,0.25)';
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 2,
                color: corStroke
            }),
            fill: new ol.style.Stroke({
                width: 2,
                color: corFill
            })
        })
    }
});

loteVector_ocorrencia = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: function(feature, res) {
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 2,
                color: 'rgba(150,150,150)'
            }),
            fill: new ol.style.Stroke({
                width: 2,
                color: 'rgba(150,150,150, 0.25)'
            })
        })
    }
});

var pesquisaLoteVector = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: function (feature, res) {
        let corStroke = "rgba(200,200,0)";//getCorStroke(feature.values_["f3"]);
        let corFill = 'rgba(200,200,0,0.25)';
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                width: 2,
                color: corStroke
            }),
            fill: new ol.style.Stroke({
                width: 2,
                color: corFill
            })
        })
    }
});

var pesquisaLoteHeatmap = new ol.layer.Heatmap({
    source: new ol.source.Vector(),
    weight: function (feature) { return feature.weight; },
    blur: 6,
    radius: 5
});

var layerZona = new ol.layer.VectorTile({
    source: new ol.source.VectorTile({
        format: new ol.format.MVT(),
        url: '/zona?&z={z}&x={x}&y={y}',
        crossOrigin: 'anonymous'
    }),
    maxZoom: 21,
    minZoom: 10,
    style: function (feature) {
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'blue',
                width: 3
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0, 0, 255, 0.1)'
            }),
            text: new ol.style.Text({
                stroke: new ol.style.Stroke({
                    width: 2,
                    color: 'white'
                }),
                fill: new ol.style.Fill({
                    color: 'blue'
                }),
                font: "bold 18px/1 Arial",
                placement: 'Point',
                text: feature.get('zona')
            })
        })
    }
});

var layerVia = new ol.layer.VectorTile({
    source: new ol.source.VectorTile({
        format: new ol.format.MVT(),
        url: urlVia,
        crossOrigin: 'anonymous'
    }),
    maxZoom: 20,
    minZoom: 18.50,
    style: function (feature) {
        return new ol.style.Style({
            text: new ol.style.Text({
                stroke: new ol.style.Stroke({
                    width: 1,
                    color: 'rgb(0, 0, 0)'
                }),
                fill: new ol.style.Fill({
                    color: 'rgb(255, 255, 255)'
                }),
                font: "bold 11px/1 Arial",
                placement: 'line',
                maxAngle: 6.283185307179586,
                text: feature.get('denominaca')
            })
        });
    },
    minResolution: 0.01,
    maxResolution: 1
});

/***** Criando linha entre dois posntos ******/
function linha_reta(start, end) {

    var sourceLinha = new ol.source.Vector();
    sourceLinha.addFeature(new ol.Feature({
        geometry: new ol.geom.LineString([start, end]),
        text: Math.floor(Math.sqrt((end[0] - start[0]) * (end[0] - start[0]) + (end[1] - start[1]) * (end[1] - start[1])))
    }));

    var styleFunctionLinha = function (feature) {
        var geometry = feature.getGeometry();
        var styles = [
            // linestring
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                text: new ol.style.Text({
                    stroke: new ol.style.Stroke({
                        width: 2,
                        color: 'rgb(0, 0, 0)'
                    }),
                    fill: new ol.style.Fill({
                        color: '#F4B813'
                    }),
                    font: "bold 20px/1 Arial",
                    placement: 'line',
                    maxAngle: 6.283185307179586,
                    textBaseline: 'bottom',
                    text: feature.get('text').toString() + "m"
                })
            })
        ];

        geometry.forEachSegment(function (start, end) {
            var dx = end[0] - start[0];
            var dy = end[1] - start[1];
            var rotation = Math.atan2(dy, dx);
            // arrows
            styles.push(new ol.style.Style({
                geometry: new ol.geom.Point(end),
                image: new ol.style.Icon({
                    src: 'img/arrow.png',
                    anchor: [0.75, 0.5],
                    rotateWithView: true,
                    rotation: -rotation
                })
            }));
        });
        return styles;
    };

    vectorLinha = new ol.layer.Vector({
        source: sourceLinha,
        style: styleFunctionLinha
    });

    const extent = sourceLinha.getFeatures()[0].getGeometry().getExtent();
    extent[0] -= 100;
    extent[1] -= 100;
    extent[2] += 100;
    extent[3] += 100;

    map.getView().fit(extent);
    map.addLayer(vectorLinha);

}

var view = new ol.View({
    center: center,
    zoom: 16,
    maxZoom: 20,
    enableRotation: false,
})

var agentes = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: function (feature) {
        const hexToRgb = hex =>
            hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
                , (m, r, g, b) => '#' + r + r + g + g + b + b)
                .substring(1).match(/.{2}/g)
                .map(x => parseInt(x, 16));
        let cor = 'rgb' + '(' + hexToRgb(feature.get('color'))[0] + ',' + hexToRgb(feature.get('color'))[1] + ',' + hexToRgb(feature.get('color'))[2] + ')';
        return [
            new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 1],
                    src: 'data:image/svg+xml;utf8,'
                        + '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin slice" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 360 560"  width="72" height="112">'
                        + '<g><path fill="' + cor + '" d="M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9 C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8,60.8-60.8 c33.6,0,60.8,27.2,60.8,60.8S216.5,248,182.9,248C149.4,248,122.2,220.8,122.2,187.2z"/>'
                        + '</g></svg>',
                    scale: 0.4
                })
            })
        ]
    }
});

function scaleControl() {
    control = new ol.control.ScaleLine({
        units: 'metric',
        bar: true,
        steps: 2,
        text: true,
        minWidth: 140
    });
    return control;
}

/***** Carregando o mapa ******/
var map = new ol.Map({
    /*controls: ol.control.defaults().extend([
        scaleControl()
    ]),*/
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM(),
            //maxZoom: 16,
            //visible: false,
        }),
        /*new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: urlOrtofoto,
            }),
            maxZoom: 20,
            minZoom: 16,
        }),*/
        new ol.layer.Vector({
            source: new ol.source.Vector(),
            visible: false,
            style: function (feature, res) {
                if (feature.get('dsc_layer') == 'LOTES_NOVOS')
                    return new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            width: 2,
                            color: 'rgba(200, 200, 0)'
                        }),
                        fill: new ol.style.Stroke({
                            width: 2,
                            color: 'rgba(200, 200, 0, 0.25)'
                        })
                    })
            }
        }),
        layerZona,
        layerVia,
        loteVector_ocorrencia,
        loteVector,
        pesquisaLoteVector,
        pesquisaLoteHeatmap,
        agentes,
        //vectorLinha
    ],
    target: "map",
    view: view
});
map.on('error', e => {
    $('#blabla').hide();
})
map.on('rendercomplete', e => {
    $('#blabla').hide();
})

var overlayAgentes = new ol.Overlay({
    element: document.getElementById('popupAgente'),
    offset: [0, -45]
});
map.addOverlay(overlayAgentes);

/***** Evento click no mapa ******/
var onClick = function (event, p, f) {
    var feature = map.forEachFeatureAtPixel(event.pixel,
        function (feature) {
            return feature;
        }
    );

    if (feature != null && feature.getGeometry().getType() == 'Point') {
        if (!feature.getProperties())
            return;

        infoAgente(feature.getProperties())
        return;
    }

    fetch("/lote", {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "lat": event.coordinate[0], "long": event.coordinate[1] })
    })
        .then(res => res.json())
        .then((out) => {
            loteVector.getSource().clear();

            if (out.status === 'error') {
                desmarcaLote();
                fechaModal('#modalInfo');
                return;
            }

            matches = new ol.format.GeoJSON().readFeatures(out);
            if (!matches)
                return;

            loteVector.getSource().addFeatures(matches);
            loteVector.setStyle(loteVector.getStyle());
            //document.getElementById('btnDados').setAttribute('class', "button btnViewdados fa-blink");

            let arr = sessionStorage.getItem('pesquisa_lote') !== "" ? JSON.parse(sessionStorage.getItem('pesquisa_lote')) : {'inscricao' : 0};
            if ( matches[0].values_.f1 !== arr.inscricao || sessionStorage.getItem('pesquisa_avancada') == '' ) {
                document.getElementById('btnStatusFiltroHistorico').setAttribute('disabled', 'disabled');
                document.getElementById('btnStatusFiltroHistorico').setAttribute('style', "color: red");
                //document.getElementById('btnStatusFiltroHistorico').setAttribute('value', "0");
            }else{
                document.getElementById('btnStatusFiltroHistorico').removeAttribute("disabled");
                document.getElementById('btnStatusFiltroHistorico').setAttribute('style', "color: green");
                //document.getElementById('btnStatusFiltroHistorico').setAttribute('value', "0");
            }
            
            if (p === '1'){
                p = ''
            }else{
                p = "1"
                infoLote(matches, p, arr.agente);
            }
        });
};

var popupAgente = function (event) {
    $('#popupAgente').popover('dispose');
    var feature = map.forEachFeatureAtPixel(event.pixel,
        function (feature) {
            return feature;
        },
        {
            layerFilter: function (layer) {
                return layer === agentes;
            },
        }
    );
    if (feature != null && feature.getGeometry().getType() == 'Point') {
        var element = overlayAgentes.getElement();
        var coordinate = feature.getGeometry().getCoordinates();
        $(element).popover('dispose');
        overlayAgentes.setPosition(coordinate);
        $(element).popover({
            container: '#popupAgente',
            placement: 'top',
            html: false,
            template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header" style="color:red"></h3><div class="popover-body"></div></div>',
            content: feature.get('name') ? feature.get('name') : ''
        });
        $(element).popover('show');
        return;
    }
}

map.on('pointermove', popupAgente);
map.on('click', onClick);
map.on('pointermove', function (evt) {
    if (evt.dragging) {
        $('#popup').popover('hide');
        return;
    }
});

function infoAgente(agente) {
    //document.getElementById('btnDados').setAttribute('class', "button btnViewdados");
    abrirModal('#modal_info_agente');
    document.getElementById('home-tab-agente').setAttribute('class', "nav-link active");
    document.getElementById('profile-tab-agente').setAttribute('class', "nav-link");
    document.getElementById('info_agente').setAttribute('class', "tab-pane fade show active");
    document.getElementById('profile_agente').setAttribute('class', "tab-pane fade");
    var infoBox = document.getElementById('info_agente');
    infoBox.innerHTML = toInfoDivAgente(agente.name);
    ocorrenciaAgente(agente.login);
}

function ocorrenciaAgente(agente) {
    let data = new Date().toJSON().slice(0, 10).split('-').join('-');
    fetch("/ocorrenciaagente?" + 'agente=' + agente.trim() + '&' + 'dataIni=' + "\'" + data.toString() + "\'" + '&' + 'dataFimm=' + "\'" + data.toString() + "\'")
        .then(res => res.json())
        .then((out) => {
            var infoBox = document.getElementById('ocorrencias_agente_ul');
            while (infoBox.firstChild)
                infoBox.removeChild(infoBox.firstChild);

            for (let i = 0; i < out.length; i++) {
                let dataFormatada = out[i].data_hora.replace(/(\d*)-(\d*)-(\d*).*/, '$3-$2-$1');
                let insc = out[i].inscricao.toString();
                let infoLi = $('<li></li>');
                let btn = $("<button title='Centralizar Lote' style='position: absolute; right: 5px; top: -20px;'\
                            onclick='centralizaPesquisa("+ '[' + out[i].vlr_pos_x + ',' + out[i].vlr_pos_y + ']' + ',' + null + ',' + "\"" + out[i].inscricao + "\")' class='button'>\
                            <i class='fas fa-map-marked-alt'></i>\
                        </button>");
                let btnFoto = out[i].fotos.length > 0 ? $(
                    "<button title='Fotos da Ocorrência' class='button' href='#lightbox' onclick='fotos_2(\"" + out[i].inscricao + "\"," + out[i].cod_ocorrencia + ")' style='position: absolute; right: 5px; top: 15px;'>\
                        <i class='far fa-images'></i>\
                    </button>"
                ) : '';
                let inscLi = $("<p>Ocorrencia: <strong>" + out[i].cod_ocorrencia + "</strong></p>");
                let rowLi = $("<div class='row' style='max-width: 100%; margin-left: inherit;'></div>");
                let colOcorrencia = $("<div class='col 12' style=''></div>");

                colOcorrencia.append($("<div class='row'>\
                                        Descrição:&nbsp; <strong>"+ out[i].ocorrencia + "</strong>\
                                    </div>\
                                    <div class='row'>\
                                        Data:&nbsp; <strong>"+ dataFormatada + "</strong>&nbsp;&nbsp;\
                                    </div>\
                                    <div class='row'>\
                                        <div title='"+ out[i].dsc_observacao + "'>\
                                            Observação:&nbsp; <strong>"+ out[i].dsc_observacao + "</strong>&nbsp;&nbsp;\
                                        </div>\
                                    </div>"), btn, btnFoto);

                let linha = $("<hr width = '100%' size = '100' style='margin-top: 1rem;margin-bottom: 10px;'>");

                rowLi.append(colOcorrencia);
                infoLi.append(inscLi.append(rowLi));
                $('#ocorrencias_agente_ul').append(infoLi, linha);
            }

        })
        .catch((e) => e)
}

function legendaTipoOcorrencia() {

    buscarTiposOcorrencia((tiposOcorrencia) => {
        let legendaUlCores = document.getElementById('ulLegendaNomeCores');
        legendaUlCores.innerHTML = "";

        let innerUl = `<li>
                            <i class='fas fa-palette' style='color:rgba(150,150,150)'></i>
                            <strong>Lotes com Ocorrências!</strong>
                        </li>`;
        /*for (const tipoOcorrencia of tiposOcorrencia) {
            innerUl += `<li>
                            <i class='fas fa-palette' style='color:${tipoOcorrencia.color}'></i>
                            <strong>${tipoOcorrencia.id} = ${tipoOcorrencia.nome}</strong>
                        </li>`;
        }*/
        legendaUlCores.innerHTML = innerUl;

        abrirModal('#modal_legenda_tipo_ocorrencia');
    });
}

function paint_map(calor) {
    if (!calor)
        legendaTipoOcorrencia();

    fetch("/ocorrencia/mapa", {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: sessionStorage.getItem('pesquisa_avancada')
    })
        .then(res => res.json())
        .then((out) => {

            let vectorTilecolor = loteVector_ocorrencia.getSource();
            vectorTilecolor.clear();
            if (!out.features)
                return;

            let layerExtent;
            let features = new ol.format.GeoJSON().readFeatures(out);
            if (!calor) {
                vectorTilecolor.addFeatures(features);
                loteVector_ocorrencia.setStyle(loteVector_ocorrencia.getStyle());
                layerExtent = vectorTilecolor.getExtent();
            }
            else {
                pesquisaLoteHeatmap.getSource().clear();
                function get_polygon_centroid(pts) {
                    return [pts[0] + (pts[2] - pts[0]) / 2, pts[1] + (pts[3] - pts[1]) / 2];
                }
                var newFeatures = [];
                for (feature of features) {
                    if (feature.getGeometry()) {
                        coordinate = get_polygon_centroid(feature.getGeometry().getExtent());
                        pesquisaLoteHeatmap.getSource().addFeature(new ol.Feature({
                            geometry: new ol.geom.Point(coordinate),
                            weight: 1
                        }));
                    }
                }
                layerExtent = pesquisaLoteHeatmap.getSource().getExtent();
                pesquisaLoteHeatmap.setStyle(pesquisaLoteHeatmap.getStyle());
            }

            map.getView().fit(layerExtent);
            map.getView().setZoom(16);

            //esconde o modal se tiver mais de duas geometrias
            if (out.features.length) {
                fechaModal('#pesquisa_avancada');
            }
        });
}

function desmarcaColor() {
    pesquisaLoteVector.getSource().clear();
    pesquisaLoteHeatmap.getSource().clear();
    loteVector_ocorrencia.getSource().clear();
}

function infoLote(dados, p, f) {
    
    let usuario = f;
    p = 1;

    //document.getElementById('btnDados').setAttribute('class', "button btnViewdados");
    abrirModal('#modalInfo');

    let filtro = document.getElementById('btnStatusFiltroHistorico').getAttribute('value');
    if (filtro == 3)//filtro == 3 ***indica que o filtro esta para mostrar todas as ocorrencias***
        usuario = undefined

    
    document.getElementById('home-tab').setAttribute('class', "nav-link active");
    document.getElementById('profile-tab').setAttribute('class', "nav-link");
    document.getElementById('info').setAttribute('class', "tab-pane fade show active");
    document.getElementById('profile').setAttribute('class', "tab-pane fade");
    var infoBox = document.getElementById('info');
    infoBox.innerHTML = toInfoDiv(dados);
    carrega_ocorrencia(dados[0].getProperties().f1, p, usuario);
};


//document.getElementById('divBtndados').onclick = function(){infoLote(dados);};

function toInfoDiv(matches) {
    console.log(matches);
    let x = matches[0].getGeometry().flatCoordinates[0];
    let y = matches[0].getGeometry().flatCoordinates[1];
    let retVal = "<p>Prontuário: <strong>" + matches[0].getProperties().f1 + "</strong>\
                  </p>";
    let responsavel = matches[0].getProperties().f2;
    retVal += "<p>Responsável: <strong>" + responsavel + "</strong> </p>";
    let num = "<strong>" + matches[0].getProperties().f5 == null ? 'S/N' : matches[0].getProperties().f5 + "</strong>";
    retVal += "<p>Logradouro: <strong>" + matches[0].getProperties().f4 + ", " + num + "</strong></p>";
    return retVal;
};

function toInfoDivAgente(matches) {
    let retVal = "<p>Nome Agente: <strong>" + matches + "</strong>\
                  </p>";
    return retVal;
};

function abrirModal(modal) {

    $(modal).modal({
        backdrop: false
    }).draggable({
        backdrop: false,
        containment: "document",
        handle: ".modal-header",
        stack: ".modal",
        start: function (event, ui) {
            let body = $(event.target).find('.modal-body');
            body.css('min-height', body.height());
            body.css('min-width', body.width());
            body.children().hide();
        },
        stop: function (event, ui) {
            let body = $(event.target).find('.modal-body');
            body.css('min-height', 0);
            body.css('min-width', 0);
            body.children().show();
        }
    });

    $('#pesquisa_avancada_content', '#pesquisa_avancada_content_resumo', '#pesquisa_avancada_content_resumo_2', '#resumo_lab_2_content').resizable({
        alsoResize: '#tab_pesquisa_avancada',
        handles: 'n, s',
        minWidth: '724px',
    });

    $('#legenda_tipo_ocorrencia_content').resizable({
    });

    $(document).off('show.bs.modal');
    $(document).on('show.bs.modal', '.modal', function (event) {
        var zIndex = 1040 + (10 * $('.modal:visible').length);
        $(this).css('z-index', zIndex);
        setTimeout(function () {
            $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
        }, 0);
    });
}

function modalPesquisaAberta(modal) {
    let attribut = document.getElementById('btnStatusFiltroHistorico').getAttribute('disabled');
    if (sessionStorage.getItem('pesquisa_avancada') !== '' && !attribut)
        abrirModal(modal)
    else
        fechaModal(modal)
}

function fechaModal(modal) {
    $(modal).modal('hide');

    if (modal == '#tipo_ocorrencia') {
        $('#form_tipo_ocorrencia input').val("");
        $('#form_tipo_ocorrencia input[type = submit]').val("Gravar");
    }

    if (modal == '#modal_layers') {
        $('#form_layers input').val("");
        $('#form_layers input[type = submit]').val("Gravar");
    }

    if (modal == '#modal_search') {
        document.getElementById('modal_search').getElementsByClassName('modal-body')[0].innerHTML = "";
    }
}

function desmarcaLote() {
    loteVector.getSource().clear();
    if ($("#lightbox_2").is(":visible"))
        fechaModal('#lightbox_2');

    if ($("#modalZoom").is(":visible"))
        fechaModal('#modalZoom');
}

function semCadastro() {
    $("#modalerro").modal({
        show: true
    });
}

/***** Criando pontos dos Agentes *****/
function addAgente(loc, nome, login, color) {
    agentes.getSource().addFeatures([
        new ol.Feature({
            geometry: new ol.geom.Point(loc),
            name: nome,
            login: login,
            color: color
        })
    ]);
}

/***** Add Agentes ao mapa *****/
document.getElementById('agentes').onclick = function fakeAgentes() {

    if (document.getElementById('agentes').classList[1] != "ativo") {
        startWorker();
        document.getElementById('agentes').classList.add("ativo")
    } else {
        stopWorker();
        document.getElementById('agentes').classList.remove("ativo");
        $('#popupAgente').popover('dispose');
        agentes.setVisible(false);
    }
}
var w;
function startWorker() {

    if (typeof (Worker) !== "undefined") {
        if (typeof (w) == "undefined") {
            w = new Worker("js/worker.js");
            agentes.setVisible(true);
        }
        w.onmessage = function (event) {
            agentes.getSource().clear();
            for (agente of event.data.data) {
                if (agente.vlr_pos_x != null) {
                    let loc = ol.proj.transform([agente.vlr_pos_x, agente.vlr_pos_y], 'EPSG:4326', 'EPSG:3857');
                    addAgente(loc, agente.name, agente.login, agente.color);
                }
            }
        };
    } else {
        document.getElementById("result").innerHTML = "Sorry, your browser does not support Web Workers...";
    }
}

function stopWorker() {
    w.terminate();
    w = undefined;
}

document.getElementById('ortofoto').onclick = function fn_ortofoto() {
    document.getElementById('ortofoto').classList.toggle("ativo");
    map.getLayers().getArray()[1].setVisible(!map.getLayers().getArray()[1].getVisible());
}

document.getElementById('layerVia').onclick = function fn_lote() {
    document.getElementById('layerVia').classList.toggle("ativo");
    layerVia.setVisible(!layerVia.getVisible());
}

document.getElementById('layerZona').onclick = function fn_lote() {
    document.getElementById('layerZona').classList.toggle("ativo");
    layerZona.setVisible(!layerZona.getVisible());
}

document.getElementById('center_map').onclick = function center_map() {
    map.getView().setCenter(center);//center);//
    map.getView().setZoom(16);
    //desmarcaLote(); 
}

function simulateEvent(type, x, y, opt_shiftKey) {
    var viewport = map.getViewport();
    var position = viewport.getBoundingClientRect();
    var shiftKey = opt_shiftKey !== undefined ? opt_shiftKey : false;
    var event = new ol.pointer.PointerEvent(type, {
        clientX: position.left + x + width / 2,
        clientY: position.top + y + height / 2,
        shiftKey: shiftKey
    });
    map.handleMapBrowserEvent(new ol.MapBrowserPointerEvent(type, map, event));
}

function ret_cadastro() {
    if (loc_selecao) {
        map.getView().setCenter(loc_selecao);
    }
    loteVector.setStyle(loteVector.getStyle());
    map.getView().setZoom(19);
}

function fotos_2(inscricao, cod_ocorrencia) {
    fetch("/ocorrencia/" + inscricao + "/" + cod_ocorrencia)
        .then(res => res.json())
        .then((out) => {
            if (out.status == 'error')
                return;

            let infoBox = document.getElementById('body_fotos');
            infoBox.innerHTML = "";

            if (!out.data)
                return;

            out = out.data;

            $('#miniFotos').html('');
            $('#carousel').html('');
            if (out[0].fotos.length > 0) {
                abrirModal("#lightbox_2");
                let foto = '<div class="card-body image-container">\
                            <img class="foto_zoom" alt="Foto 1" src="" data-imagezoom="true" data-magnification="5" data-zoomviewsize="[180,180]">\
                        </div>\
                        <div class="card-footer text-center">\
                            <a href="#" class="btn btn-dark abreFotoZoom">\
                                <i class="fas fa-search-plus"></i>\
                            </a>\
                        </div>';

                for (let i = 0; i < 8; i++) {
                    div = document.createElement("div");
                    div.innerHTML = foto;
                    div.setAttribute('class', 'card');
                    if (i < out[0].fotos.length) {
                        let img = '/ocorrencia/download/' + out[0].fotos[i];
                        div.getElementsByClassName('foto_zoom')[0].setAttribute('src', img);
                        div.getElementsByClassName('abreFotoZoom')[0].setAttribute('onclick', "abrirImagem('" + img + "')");
                    }
                    else
                        div.getElementsByClassName('foto_zoom')[0].setAttribute('src', "/img/img_off.gif");

                    $('#body_fotos').append(div);
                }
            } else {
                if ($('#lightbox_2').is(':visible'))
                    $('#lightbox_2').modal('hide');
            }
        })
};

function abrirImagem(img, descricao) {
    abrirModal("#modalZoom");

    let foto = `<div class="col-xs-10 col-md-12 divImg">
                    <a href="#" class="thumbnail imgZoom">
                        <img  class="img" src="${img}" alt="imagem" data-imagezoom="true" data-magnification="5" />
                    </a>
                </div>`;

    let btn_x = `<button type="button" class="close btn-default" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                 <button type="button" class="btn btn-dark btnImgFull"
                    style="background-color: transparent; border-color: transparent; color: #6a6a6a; margin-left: 85%; padding: 0px;"
                    onclick="abrirImgZoom()" data-toggle="tooltip" data-title="Ampliar/Desampliar a imagem">
                        <i class="fa fa-search-plus" aria-hidden="true"></i>
                </button>`;

    document.getElementById('header_zoom').innerHTML = btn_x;
    document.getElementById('row_zoom').innerHTML = foto;
}

function abrirImgZoom() {
    if ($('#modalZoom').length > 0) {
        var img = $('#modalZoom .imgZoom img').attr('src');
        var descricao = $('#modalZoom h5.modal-title').text();
        $('#modalImgZoom').find('.modal-body').html('');
        $('#modalImgZoom').find('.modal-body').append('<div class="content-zoom">' +
            '<div class="row">' +
            '  <div class="col-xs-10 col-md-12 divImg">' +
            '    <img src="' + img + '" alt="imagem" /> ' +
            '  </div>' +
            '</div>' +
            '</div>');
        $('#modalImgZoom').modal('show');
    }
}

function filtroHistoricoVisita() {
    let valor = document.getElementById('btnStatusFiltroHistorico').value;
    let arr = JSON.parse(sessionStorage.getItem('pesquisa_lote'));
    let inscClick = document.getElementById('info').getElementsByTagName('p')[0].innerText.substring(12);
    console.log(inscClick);
    let inscricao = arr.inscricao;
    let agente = arr.agente;
    if (valor === '1') {
        carrega_ocorrencia(inscricao);
        document.getElementById('btnStatusFiltroHistorico').setAttribute("value" , "3");
        document.getElementById('btnStatusFiltroHistorico').setAttribute('style', "color: #F0E68C");
    }else{
        carrega_ocorrencia(inscricao, undefined, agente);
        document.getElementById('btnStatusFiltroHistorico').setAttribute("value" , "1");
        document.getElementById('btnStatusFiltroHistorico').setAttribute('style', "color: green");
    };
    console.log("Valor do elemento: " , valor)
}

function carrega_ocorrencia(insc, p, usuario) {
    
    fetch('/ocorrenciasus/' + insc + '/' + usuario)//fetch('/ocorrencia/' + insc)
        .then(res => res.json())
        .then((out) => {
            if (out.status == 'error') {
                let infoBox = document.getElementById('ocorrencia_lote_ul');
                infoBox.innerHTML = "";
            }

            let infoBox = document.getElementById('ocorrencia_lote_ul');
            infoBox.innerHTML = "";

            if (!out.data)
                return;

            let filtro = document.getElementById('btnStatusFiltroHistorico').getAttribute('value');
            if (filtro == 3)//filtro == 3 ***indica que o filtro esta para mostrar todas as ocorrencias***
                document.getElementById('btnStatusFiltroHistorico').setAttribute('style', "color: #F0E68C");

            let inner = '';

            for (ocorrencia of out.data) {
                inner += ocorrenciaRender(ocorrencia, true, p);
            }

            infoBox.innerHTML = inner;
        })
};

function pesquisa(e) {

    let pesquisa = document.getElementById('insc').value;
    if (!pesquisa)
        return;

    const classList = document.getElementById('ddMenuPesquisa').getElementsByTagName('svg')[0].classList;

    if (classList.contains('fa-globe')) {
        pesquisa = pesquisa.replace(/\./g, "");
        pesquisaPorInscricao(pesquisa);
    }
    else if (classList.contains('fa-map')) {
        pesquisaPrincipal(pesquisa, 'logradouro');
    }
    else {
        pesquisaPrincipal(pesquisa, 'responsavel');
    }

}

function pesquisaPorInscricao(inscricao, p, f) {
    const insc = inscricao;
    const ag = f;
    const filtro = {
        inscricao: insc,
        agente: ag,
    }
    sessionStorage.setItem('pesquisa_lote', JSON.stringify(filtro));

    if (sessionStorage.getItem('pesquisa_avancada') !== ''){
        document.getElementById('btnStatusFiltroHistorico').removeAttribute("disabled");
        document.getElementById('btnStatusFiltroHistorico').setAttribute('style', "color: green");
        document.getElementById('btnStatusFiltroHistorico').setAttribute('value', "1");
    }

    document.getElementById('insc').parentElement.nextElementSibling.classList.toggle('disabled');
    document.getElementById('insc').parentElement.nextElementSibling.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    fetch("lote/centroid", {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "inscricao": inscricao })
    })
        .then(res => res.json())
        .then((out) => {
            if (out.status == 'ok') {
                fechaModal('#modalerroInsc');
                centralizaPesquisa(out.data, 19, inscricao, p, f);
            }

            if (out.status == 'error') {
                //fechaModal('#modalInfo');
                desmarcaLote();
                abrirModal('#modalerroInsc');
            }

            document.getElementById('insc').parentElement.nextElementSibling.classList.toggle('disabled');
            document.getElementById('insc').parentElement.nextElementSibling.innerHTML = '<i class="fa fa-search"></i>';

        });
}

function centralizaPesquisa(center, zoom, inscricao, p, f) {
    map.getView().setCenter(center);
    if (zoom)
        map.getView().setZoom(zoom);
    if (inscricao) {
        onClick({
            coordinate: center,
            map: map,
            pixel: [100, 10],
            wasVirtual: true
        }, p, f);
        loteVector.setStyle(loteVector.getStyle());
    }
    return center;
}

function pesquisaPrincipal(pesquisa, tipo) {
    document.getElementById('insc').parentElement.nextElementSibling.classList.toggle('disabled');
    document.getElementById('insc').parentElement.nextElementSibling.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    fetch("/search/" + tipo, {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "pesquisa": pesquisa })
    })
        .then(res => res.json())
        .then((out) => {
            if (out.status == 'error')
                abrirModal('#modalerro');
            else {
                if (out.data != null) {
                    abrirModal('#modal_search');
                    carregarModalBody('modal_search', out.data);
                }
            }
            document.getElementById('insc').parentElement.nextElementSibling.classList.toggle('disabled');
            document.getElementById('insc').parentElement.nextElementSibling.innerHTML = '<i class="fa fa-search"></i>';
        });
}

function carregarModalBody(elementId, data) {
    const element = document.getElementById(elementId).getElementsByClassName('modal-body')[0];
    if (!element)
        return;

    element.innerHTML = "";

    let inner = '<ul class="list-group" style="padding: 10px; background: #E4E4E4; max-height: max-content; overflow-x: hidden;max-height: 450px; overflow-y: auto; border: 1px solid !important;">';

    for (result of data) {
        inner += `<li class='list-group-item' style='border-bottom:1px solid #aaa; padding-bottom: 5px; margin-bottom: 5px;'>
            <div class='row col-12'>
                <strong>Responsável:</strong>&nbsp${result.responsavel} <br>
            </div>
            <div class='row col-12'>
                <strong>Logradouro:</strong>&nbsp${result.logradouro}, ${result.nimovel} <br>
            </div>
            <div class='row'>
                <div class='col-8'>
                    <strong>Inscrição:</strong>&nbsp${result.inscricao} <br>
                </div>
                <div class='col text-right'>
                    <button title='Centralizar no lote' onclick='pesquisaPorInscricao("${result.inscricao}")' class='button ml-1'>
                        <i class='fas fa-map-marked-alt'></i>
                    </button>
                </div>
            </div>
        </li>`;
    }

    inner += '</ul>';

    element.innerHTML = inner;
}

function carregaInfoPesquisa() {
    if (!sessionStorage.getItem('pesquisa_avancada')) {
        document.getElementById("form_pesquisa_avancada_dataIni").valueAsDate = new Date();
        document.getElementById("form_pesquisa_avancada_dataFim").valueAsDate = new Date();
    }

    preencheComboAgentes();
    preencheComboTiposOcorrencia();
    preencheComboZona();
    preencheComboCategoria();
}

function preencheComboCategoria() {
    let comboCategoria = document.getElementById("form_pesquisa_avancada_categoria");
    let inner = '<option value=""/>';
    buscarCategoria((categorias) => {
        for (categoria of categorias)
            inner += `<option value="${categoria.categoria_localidade}">${categoria.categoria_localidade.replace(/\./g, "")}</option>`;
        comboCategoria.innerHTML = inner;
    });
}

function preencheComboAgentes() {
    let comboAgente = document.getElementById("form_pesquisa_avancada_agente");
    let inner = '<option value=""/>';
    buscarAgentes((agentes) => {
        for (agente of agentes)
            inner += `<option value="${agente.id}">${agente.name.replace(/\./g, "")}</option>`;
        comboAgente.innerHTML = inner;
    });
}

function preencheComboTiposOcorrencia() {
    let comboTipo = document.getElementById('form_pesquisa_avancada_tipo');
    let inner = '<option value="" />';
    buscarTiposOcorrencia((tiposOcorrencia) => {
        for (tipoOcorrencia of tiposOcorrencia) {
            inner += '<option value="' + tipoOcorrencia.id + '">' + tipoOcorrencia.id + ' - ' + tipoOcorrencia.nome + '</option>';
        }
        comboTipo.innerHTML = inner;
    });
}

function preencheComboZona() {
    let comboZona = document.getElementById('form_pesquisa_avancada_zona');
    let inner = '<option value="" />';
    buscarZonas((zonas) => {
        for (zona of zonas) {
            inner += `<option value="${zona.zona}">${zona.descricao}</option>`;
        }
        comboZona.innerHTML = inner;
    });
}

function clearChildren(element) {
    for (var i = 0; i < element.childNodes.length; i++) {
        var e = element.childNodes[i];
        if (e.tagName) switch (e.tagName.toLowerCase()) {
            case 'input':
                switch (e.type) {
                    case "radio":
                    case "checkbox": e.checked = false; break;
                    case "button":
                    case "submit":
                    case "image": break;
                    default: e.value = ''; break;
                }
                break;
            case 'select': e.selectedIndex = 0; break;
            case 'textarea': e.innerHTML = ''; break;
            default: clearChildren(e);
        }
    }
}

function limpar_pesquisa() {
    clearChildren(document.getElementById("pesquisa-avancada-form"));

    document.getElementById('btnStatusFiltro').setAttribute('style', "color: red");
    document.getElementById('btnStatusFiltroHistorico').setAttribute('style', "color: red");
    document.getElementById('btnStatusFiltroHistorico').setAttribute('value', "0");
    document.getElementById('btnStatusFiltroHistorico').setAttribute('disabled', "disabled");
    sessionStorage.setItem('pesquisa_avancada', '');
    sessionStorage.setItem('pesquisa_lote', '');
    if ($('#modal_legenda_tipo_ocorrencia').is(':visible')) {
        paint_map();
    } else {
        desmarcaColor();
    }
    fechaModal("#pesquisa_avancada_resumo");
    fechaModal('#pesquisa_avancada_resumo_2');
    fechaModal('#modalInfo');
    desmarcaLote();
    document.getElementById('pesquisa_avancada_ul').innerHTML = "";
    document.getElementById('tab_pesquisa_avancada').hidden = true;
    document.getElementById('footer_pesquisa').innerHTML = "";
    document.getElementById('grafico_bar').setAttribute('style', "display: block; pointer-events: none;");
}

function CriaPDF() {
    let arr = JSON.parse(sessionStorage.getItem('pesquisa_avancada'));
    var minhaTabela = document.getElementById('pesquisa_avancada_ul').innerHTML;
    var style = "<style>";
    style += "hr {margin-top: 10px;margin-bottom: 10px;display: inline-table;border-block-end: none;}";
    style += "h1 {text-align: center;}";
    style += "body {font-family: Georgia, serif; background: none; color: black;}";
    style += "@page {size: 5.5in 8.5in;size: A4 landscape;}";
    style += "table {width: 100%;font: 20px Calibri;}";
    style += "table, th, td {border: solid 1px #DDD; border-collapse: collapse;";
    style += "padding: 2px 3px;text-align: center;}";
    style += "li {list-style-type: none;}";
    style += "#cabecalho {padding: 10px; background: #E4E4E4; border: 1px solid !important;}";
    style += "@media print {button {display :  none;}}";
    style += style + "</style>";


    // CRIA UM OBJETO WINDOW
    var win = window.open('', '', 'height=700,width=700');
    win.document.write('<html><head>');
    win.document.write('<title>Relatório de Ocorrências</title>');
    win.document.write(style);
    win.document.write('</head>');
    win.document.write('<body>');
    win.document.write('<h1>Relatório de Ocorrências</h1>');
    if (arr) {
        win.document.write('<div id="cabecalho">');
        if (arr.dataIni) {
            win.document.write('<p>Perí­odo:&nbsp;');
            win.document.write('<strong>' + arr.dataIni + '</strong>' + '&nbsp;á&nbsp;' + '<strong>' + arr.dataFim + '</strong>');
            win.document.write('</p>');
        }
        if (arr.tipo) {
            win.document.write('<p>Tipo de Ocorrência:&nbsp;');
            win.document.write('<strong>' + arr.dsc_tipo_ocorrencia + '</strong>');
            win.document.write('</p>');
        }
        if (arr.insc) {
            win.document.write('<p>Inscrição:&nbsp;');
            win.document.write('<strong>' + arr.insc + '</strong>');
            win.document.write('</p>');
        }
        if (arr.agente) {
            win.document.write('<p>Agente:&nbsp;');
            win.document.write('<strong>' + arr.agente + '</strong>');
            win.document.write('</p>');
        }
        win.document.write('</div>');
    }
    win.document.write(minhaTabela);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
}

var myChart;

function grafSelectOnChange(e) {
    closeGrafico();
    fetch("/grafico/" + e.target.value, {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: sessionStorage.getItem('pesquisa_avancada')
    })
        .then(res => res.json())
        .then((out) => {
            function getRandomColor() {
                var letters = '0123456789ABCDEF';
                var color = '#';
                for (var i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            }


            if (out.status == 'error') {
                abrirModal('#modalerro');
            }
            else {
                if (!out.data)
                    return;

                label = new Array();
                data = new Array();
                color = new Array();
                for (let i = 0; i < out.data.length; i++) {
                    label.push(out.data[i].label);
                    data.push(out.data[i].value);
                    color.push(Chart.helpers.color(getRandomColor()).alpha(0.5).rgbString());
                }

                var ctx = document.getElementById('myChart').getContext('2d');

                myChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: label,
                        datasets: [{
                            label: e.target.value,
                            backgroundColor: color,
                            data: data
                        }]
                    },
                    options: {
                        legend: {
                            display: true,
                            align: 'center',
                            fontSize: 5
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }],
                            xAxes: [{
                                ticks: {
                                    callback: function (value) {
                                        if (value.length > 12) {
                                            return value.substr(0, 12) + '...'; //truncate
                                        } else {
                                            return value
                                        }

                                    },
                                }
                            }],
                        },
                        tooltips: {
                            enabled: true,
                            mode: 'label',
                            callbacks: {
                                title: function (tooltipItems, data) {
                                    var idx = tooltipItems[0].index;
                                    return data.labels[idx]; //do something with title
                                }
                            }
                        }
                    }
                });
            }
        });
}

function criarGrafico(tipoGrafico) {
    if ($('#modal_grafico').is(':visible')) {
        closeGrafico();
    }

    abrirModal('#modal_grafico');
    var event = new Event('change');
    // Dispatch it.
    document.getElementById('grafSelect').dispatchEvent(event);
}

function closeGrafico() {
    if (myChart)
        myChart.destroy();
}

function buscarAgentes(afterFunction) {
    fetch('/user/all/app')
        .then(res => res.json())
        .then((out) => {
            if (out.status != 'ok') {
                throw out.error;
            }

            if (afterFunction)
                afterFunction(out.data);
        });

}
function buscarTiposOcorrencia(afterFunction) {
    fetch("/tipo_ocorrencia")
        .then(res => res.json())
        .then((out) => {
            if (out.status != 'ok') {
                throw out.error;
            }

            tiposOcorrencia = out.data;

            if (afterFunction)
                afterFunction(tiposOcorrencia);
        });
}

function buscarCategoria(afterFunction) {
    fetch("/ocorrenciasus/categorias")
        .then(res => res.json())
        .then((out) => {
            if (out.status != 'ok') {
                throw out.error;
            }

            categorias = out.data;

            if (afterFunction)
                afterFunction(categorias);
        });
}


function buscarZonas(afterFunction) {
    if (zonas) {
        if (afterFunction)
            afterFunction(zonas);
        return;
    }

    fetch("/zona/all")
        .then(res => res.json())
        .then((out) => {
            if (out.status != 'ok') {
                throw out.error;
            }

            zonas = out.data;

            if (afterFunction)
                afterFunction(zonas);
        });
}

function updatePesquisaSessionStorage() {
    const zona = document.getElementById('form_pesquisa_avancada_zona').value;
    const agente = document.getElementById('form_pesquisa_avancada_agente').value;
    const dataIni = document.getElementById('form_pesquisa_avancada_dataIni').value;
    const dataFim = document.getElementById('form_pesquisa_avancada_dataFim').value;
    const tipo = document.getElementById('form_pesquisa_avancada_tipo').value;
    e = document.getElementById('form_pesquisa_avancada_tipo');
    //const dsc_tipo_ocorrencia = e.selectedIndex >= 0 ? e.options[e.selectedIndex].text : '';

    const filtro = {
        zona: zona,
        agente: agente,
        dataIni: dataIni,
        dataFim: dataFim,
        tipo: tipo,
        //dsc_tipo_ocorrencia: dsc_tipo_ocorrencia
    }
    sessionStorage.setItem('pesquisa_avancada', JSON.stringify(filtro));
}

function ocorrenciaSearch() {
    
    updatePesquisaSessionStorage();

    document.getElementById('btnStatusFiltro').setAttribute('style', "color: green");
    //document.getElementById('btnStatusFiltroHistorico').setAttribute('style', "color: green");
    //document.getElementById('btnStatusFiltroHistorico').setAttribute('value', "1");
    if ($('#modal_legenda_tipo_ocorrencia').is(':visible')) {
        paint_map();
    }

    let inputs = document.querySelector("#pesquisa-avancada-form").querySelectorAll("input,select");
    var formData = {};
    for (const input of inputs) {
        if (input.type == 'checkbox')
            formData[input.name] = input.checked;
        else
            formData[input.name] = input.value;
    }

    let ag = inputs[2].value != '' ? inputs[2].value : 0;
    console.log(ag)

    fetch("ocorrenciasus/search", {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)//JSON.stringify(Object.fromEntries(formData))
    })
        .then(res => res.json())
        .then((out) => {
            if (out.status == 'ok') {
                ocorrenciasRender(out.data, ag);
                //console.log(out.data);
            }
            else {
                abrirModal('#modalerro');
                limpar_pesquisa();
            }
        });
}

function ocorrenciasRender(ocorrencias, f) {
    
    if (!ocorrencias)
        return;

    let pesquisaUl = document.getElementById('pesquisa_avancada_ul')
    pesquisaUl.innerHTML = "";

    let ulBuffer = "";
    for (ocorrencia of ocorrencias) {
        ulBuffer += ocorrenciaRender(ocorrencia, undefined, undefined, f);
    }
    //console.log('ocorrenciasRender: ' + ulBuffer);
    pesquisaUl.innerHTML = ulBuffer;
    document.getElementById('tab_pesquisa_avancada').hidden = false;
    criaFooter();
}

function criaFooter() {
    let pesquisaFooter = document.getElementById('footer_pesquisa');
    pesquisaFooter.innerHTML = "";

    document.getElementById('pesquisa_avancada_ul').setAttribute('style', "height: 255px; width: 100%;");
    document.getElementById('tab_pesquisa_avancada').setAttribute('style', "opacity: initial; height: 266px;");
    document.getElementById('grafico_bar').setAttribute('style', "display: block;");
    document.getElementById('grafico_bar').setAttribute('onclick', "criarGrafico(\"" + 'bar' + "\")");
    //document.getElementById('grafico_polarArea').setAttribute('style', "display: block;");
    //document.getElementById('grafico_polarArea').setAttribute('onclick', "criarGrafico(\""+'polarArea'+"\")");

    pesquisaFooter.innerHTML = "<a href='#' class='btn btn-sm btn-light' title='Imprimir pesquisa' onclick='CriaPDF()' disabled>\
                        <i class='fas fa-print'></i>\
                    </a>\
                    <a href='#' class='btn btn-sm btn-light' title='Resultado' onclick='somarValores()'>\
                        <i class='far fa-file-alt'></i>\
                    </a>\
                    <a href='#' class='btn btn-sm btn-light disabled' title=''Pesquisa temática' onclick=''>\
                        <i class='fas fa-search-location'></i>\
                    </a>\
                    <button type='button' style='visibility: collapse' class='btn btn-sm btn-primary' title='Exibir mapa de calor' onclick='paint_map(true)'><i class='fa fa-fire'></i></button>\
                    <button type='button' style='visibility: collapse' class='btn btn-sm btn-primary' onclick='paint_map()'><i class='fa fa-map-marked-alt'></i> Mostrar no Mapa</button>\
                    ";
}

function ocorrenciaRender(ocorrencia, centralizaLote = true, p, f) {    
    let user_id = formataAgente(ocorrencia.id_usuario, ocorrencia.updated_at, ocorrencia.color, ocorrencia.usuario_nome);
    let dataServer = new Date(ocorrencia.data_cadastro);
    let horaServer = ocorrencia.hora_fim_cad;
    let dataFormatada = dataServer.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    var hora = horaServer.toString().replace(/(\d{2})(\d)/, "$1:$2");
    hora = hora.toString().replace(/(\d{2})(\d)/, "$1:$2");
    let btnFotos = "";
    let btnCentraliza = "";
    let levantamanto = "";
    let ag = f != 0 && f != undefined ? ocorrencia.id_usuario : 0;
    console.log(ag)
    if (ocorrencia.tem_foto) {
        btnFotos = `<button title='Abrir fotos' href='#lightbox' onclick='fotos_2("${ocorrencia.inscricao}","${ocorrencia.id}")' class='button ml-1'>
            <i class='far fa-images'></i>
        </button>`;
    }

    if (ocorrencia.tem_foto) {
        levantamanto = `<button title='Dados do levantamento' href='#lightbox' onclick='fotos_2("${ocorrencia.inscricao}","${ocorrencia.id}")' class='button ml-1'>
            <i class="fas fa-stethoscope"></i>
        </button>`;
    }
    if (centralizaLote) {
        btnCentraliza = `<button title='Centralizar no lote' onclick='fechaModal("#pesquisa_avancada");pesquisaPorInscricao("${ocorrencia.inscricao}","${p}","${ag}")' class='button ml-1'>
            <i class='fas fa-map-marked-alt'></i>
        </button>`
    }
    let ocorrenciaLi =
        `<li style='border-bottom:1px solid #aaa; padding-bottom: 5px; margin-bottom: 5px;'><p id='prontuario'>Prontuário: <strong> ${ocorrencia.inscricao} </strong></p>
            <div class='container' style='max-width: 100%; margin-left: inherit;'>
                <div class='row'>
                    <div class='col'>
                        <div class='row'>
                            Data:&nbsp;<strong>${dataFormatada}</strong>&nbsp;
                            Hora:&nbsp;<strong>${hora}</strong>&nbsp;
                            <div title='${ocorrencia.observacoes}'>
                                Obs:&nbsp;<strong>${ocorrencia.observacoes.substr(0, 10)}...</strong>
                            </div>
                        </div>
                        <div class='row'>
                            Cód. Ocorrência:&nbsp;<strong>${ocorrencia.sequencia}</strong>&nbsp;
                        </div>
                    </div>
                </div>
            </div>
            <div class='row'>
                <div class='col'>
                    Agente:&nbsp;<strong>${user_id}</strong>
                </div>
                <div class='col text-right'>
                    ${btnCentraliza}
                    ${levantamanto}
                    ${btnFotos}
                </div>
            </div>
        </li>`;
    return ocorrenciaLi;
}

function formataTipoOcorrencia(tipo_ocorrencia) {

    if (tipo_ocorrencia)
        return `${tipo_ocorrencia.id} - ${tipo_ocorrencia.nome}`;

    return 'Tipo ocorrencia inválida';
}

function formataAgente(user, updated_at, color, name) {
    if (!user)
        return "";

    let dataCoordenada = new Date(updated_at);
    let dia = (new Date() - dataCoordenada) / 86400000;

    color = color;
    if (dia == 1)
        color = 'green';
    else if (dia > 1)
        color = 'gray';

    let svg = '<svg class="ml-2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 360 560" enable-background="new 0 0 365 560" xml:space="preserve" style="width: 12;">'
        + '<g><path fill="' + color + '" d="M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9   C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8,60.8-60.8   c33.6,0,60.8,27.2,60.8,60.8S216.5,248,182.9,248C149.4,248,122.2,220.8,122.2,187.2z"/>'
        + '</g></svg>';

    ret = name + svg;

    return ret;
};

function formataAgenteGia(user) {
    if (!user)
        return "";

    let ret = '';

    fetch('/user/userpage/' + user)
        .then(res => res.json())
        .then((out) => {
            if (out.status != 'ok') {
                throw out.error;
            }

            let dataCoordenada = new Date(out.data[0].updated_at);
            let dia = (new Date() - dataCoordenada) / 86400000;

            color = out.data[0].color;
            if (dia == 1)
                color = 'green';
            else if (dia > 1)
                color = 'gray';

            let svg = '<svg class="ml-2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 360 560" enable-background="new 0 0 365 560" xml:space="preserve" style="width: 12;">'
                + '<g><path fill="' + color + '" d="M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9   C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8,60.8-60.8   c33.6,0,60.8,27.2,60.8,60.8S216.5,248,182.9,248C149.4,248,122.2,220.8,122.2,187.2z"/>'
                + '</g></svg>';

            ret = out.data[0].name + svg;

            return ret;
        });
}

function resumoSemana() {
    abrirModal('#pesquisa_avancada_resumo');
    abrirModal('#pesquisa_avancada_resumo_2');

    setTimeout(function () {
        somarValores();
    }, 500);

}

function somarValores() {

    let inputs = document.querySelector("#pesquisa-avancada-form").querySelectorAll("input,select");
    var formData = {};
    for (const input of inputs) {
        if (input.type == 'checkbox')
            formData[input.name] = input.checked;
        else
            formData[input.name] = input.value;
    }

    fetch("ocorrenciasus/searchResumo", {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)//JSON.stringify(Object.fromEntries(formData))
    })
        .then(res => res.json())
        .then((out) => {
            if (out.status == 'ok') {
                //console.log(out.data.length);
                //**** N. de Imóveis trabalhados por tipo ****
                let concluida = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.concluida, 10) || 0;
                }, 0);
                let tipo_imovel_r = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.tipo_imovel_r_sum, 10) || 0;
                }, 0);
                let tipo_imovel_c = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.tipo_imovel_c, 10) || 0;
                }, 0);
                let tipo_imovel_tb = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.tipo_imovel_tb, 10) || 0;
                }, 0);
                let tipo_imovel_pe = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.tipo_imovel_pe, 10) || 0;
                }, 0);
                let tipo_imovel_o = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.tipo_imovel_o, 10) || 0;
                }, 0);
                let total_tipo = tipo_imovel_r + tipo_imovel_c + tipo_imovel_tb + tipo_imovel_pe + tipo_imovel_o;

                //**** N. de Imóveis ****
                let focal_larv_tipo = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.focal_larv_tipo, 10) || 0;
                }, 0);
                let focal_larv_qtde = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.focal_larv_qtde, 10) || 0;
                }, 0);
                let focal_larv_qtde_dep_trat = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.focal_larv_qtde_dep_trat, 10) || 0;
                }, 0);
                let focal = focal_larv_tipo + focal_larv_qtde + focal_larv_qtde_dep_trat;

                let perifocal_adult_tipo = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.perifocal_adult_tipo, 10) || 0;
                }, 0);
                let perifocal_adult_qtde_cargas = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.perifocal_adult_qtde_cargas, 10) || 0;
                }, 0);
                let perifocal = perifocal_adult_tipo + perifocal_adult_qtde_cargas;
                let imovel_inspecionado = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.imovel_inspecionado, 10) || 0;
                }, 0);

                //** Pendência */
                let pendencia_rec = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.pendencia_rec, 10) || 0;
                }, 0);
                let pendencia_fec = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.pendencia_fec, 10) || 0;
                }, 0);

                //** N. de Depósitos Inspecionados por Tipo */
                let dep_insp_a1 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.dep_insp_a1, 10) || 0;
                }, 0);
                let dep_insp_a2 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.dep_insp_a2, 10) || 0;
                }, 0);
                let dep_insp_b = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.dep_insp_b, 10) || 0;
                }, 0);
                let dep_insp_c = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.dep_insp_c, 10) || 0;
                }, 0);
                let dep_insp_d1 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.dep_insp_d1, 10) || 0;
                }, 0);
                let dep_insp_d2 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.dep_insp_d2, 10) || 0;
                }, 0);
                let dep_insp_e = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.dep_insp_e, 10) || 0;
                }, 0);
                let total_di_tipo = dep_insp_a1 + dep_insp_a2 + dep_insp_b + dep_insp_c + dep_insp_d1 + dep_insp_d2 + dep_insp_e;

                //** Modal Pesquisa e Tratamento - Resumo da Semana Tela 2 */
                let qtde_tributos = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.qtde_tributos, 10) || 0;
                }, 0);
                let dep_eliminados = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.dep_eliminados, 10) || 0;
                }, 0);

                //** Depósitos tratados/Larvecida */
                let tipo_focal_larv = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.tipo_focal_larv, 10) || 0;
                }, 0);
                let qtde_focal_larv = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.qtde_focal_larv, 10) || 0;
                }, 0);
                let qtde_dep_trat_focal_larv = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.qtde_dep_trat_focal_larv, 10) || 0;
                }, 0);

                //** Depósitos tratados/Adultecida */
                let tipo_perifocal_adult = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.tipo_perifocal_adult, 10) || 0;
                }, 0);
                let qtde_cargas_perifocal_adult = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.qtde_cargas_perifocal_adult, 10) || 0;
                }, 0);

                //** N. Imóveis *
                let imoveis_tratados = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.imoveis_tratados, 10) || 0;
                }, 0);
                let resgate = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.resgate, 10) || 0;
                }, 0);

                abrirModal('#pesquisa_avancada_resumo');
                abrirModal('#pesquisa_avancada_resumo_2');

                //**** N. de Imóveis trabalhados por tipo ****                 
                document.getElementById("concluida").value = concluida != null ? concluida : '0';
                document.getElementById("tipo_imovel_r").value = tipo_imovel_r != null ? tipo_imovel_r : '0';
                document.getElementById("tipo_imovel_c").value = tipo_imovel_c != null ? tipo_imovel_c : '0';
                document.getElementById("tipo_imovel_tb").value = tipo_imovel_tb != null ? tipo_imovel_tb : '0';
                document.getElementById("tipo_imovel_pe").value = tipo_imovel_pe != null ? tipo_imovel_pe : '0';
                document.getElementById("tipo_imovel_o").value = tipo_imovel_o != null ? tipo_imovel_o : '0';
                document.getElementById("total_tipo").value = total_tipo != null ? total_tipo : '0';

                //**** N. de Imóveis ****
                document.getElementById("focal").value = focal != null ? focal : '0';
                document.getElementById("perifocal").value = perifocal != null ? perifocal : '0';
                document.getElementById("imovel_inspecionado").value = imovel_inspecionado != null ? imovel_inspecionado : '0';

                //** Pendência */
                document.getElementById("pendencia_rec").value = pendencia_rec != null ? pendencia_rec : '0';
                document.getElementById("pendencia_fec").value = pendencia_fec != null ? pendencia_fec : '0';

                //** N. de Depósitos Inspecionados por Tipo */
                document.getElementById("dep_insp_a1").value = dep_insp_a1 != null ? dep_insp_a1 : '0';
                document.getElementById("dep_insp_a2").value = dep_insp_a2 != null ? dep_insp_a2 : '0';
                document.getElementById("dep_insp_b").value = dep_insp_b != null ? dep_insp_b : '0';
                document.getElementById("dep_insp_c").value = dep_insp_c != null ? dep_insp_c : '0';
                document.getElementById("dep_insp_d1").value = dep_insp_d1 != null ? dep_insp_d1 : '0';
                document.getElementById("dep_insp_d2").value = dep_insp_d2 != null ? dep_insp_d2 : '0';
                document.getElementById("dep_insp_e").value = dep_insp_e != null ? dep_insp_e : '0';
                document.getElementById("total_di_tipo").value = total_di_tipo != null ? total_di_tipo : '0';

                //** Modal Pesquisa e Tratamento - Resumo da Semana Tela 2 */
                document.getElementById("qtde_tributos").value = qtde_tributos != null ? qtde_tributos : '0';
                document.getElementById("dep_eliminados").value = dep_eliminados != null ? dep_eliminados : '0';

                //** Depósitos tratados/Larvecida */
                document.getElementById("tipo_focal_larv").value = tipo_focal_larv != null ? tipo_focal_larv : '0';
                document.getElementById("qtde_focal_larv").value = qtde_focal_larv != null ? qtde_focal_larv : '0';
                document.getElementById("qtde_dep_trat_focal_larv").value = qtde_dep_trat_focal_larv != null ? qtde_dep_trat_focal_larv : '0';

                //** Depósitos tratados/Adultecida */
                document.getElementById("tipo_perifocal_adult").value = tipo_perifocal_adult != null ? tipo_perifocal_adult : '0';
                document.getElementById("qtde_cargas_perifocal_adult").value = qtde_cargas_perifocal_adult != null ? qtde_cargas_perifocal_adult : '0';

                //** N. Imóveis */
                document.getElementById("imoveis_tratados").value = imoveis_tratados != null ? imoveis_tratados : '0';
                document.getElementById("resgate").value = resgate != null ? resgate : '0';
            }
            else {
                abrirModal('#modalerro');
                fechaModal('#pesquisa_avancada_resumo');
                fechaModal('#pesquisa_avancada_resumo_2');
            }
        });
}

$('#form_shape').submit(function (event) {
    event.preventDefault();
    var data = new FormData($('#form_shape')[0]);

    $.ajax({
        type: 'POST',
        method: 'POST',
        enctype: 'multipart/form-data',
        url: '/uploading',
        cache: false,
        contentType: false,
        processData: false,
        data: data,
        success: function (data) {
            alert("Shape incluido com sucesso!");
        }
    });
    $('#shape').modal('hide');
    return false;
});

function layersAtivo(tag) {
    var tag_li = document.getElementById('layers_ul');
    var tag_div = tag_li.getElementsByTagName('div');
    for (i = 0; i < tag_div.length; i++) {
        tag_div[i].style.backgroundColor = "";
    }
    tag.style.backgroundColor = "#4A87FD55";
    document.getElementById('nome_layer').value = tag.dataset.name;
    document.getElementById('id_layer').value = tag.id;
    document.getElementById('tabela').value = tag.dataset.tabela;
    document.getElementById('descricao').value = tag.dataset.descricao;

}

$('#form_layers').submit(function (e) {
    if (document.getElementById('id_layer').value == "") {
        e.preventDefault();

        var form_data = $(this).serialize();
        var form_url = $(this).attr("action");
        var form_method = $(this).attr("method").toUpperCase();

        $.ajax({
            url: form_url,
            type: form_method,
            data: form_data,
            cache: false,
            success: function (returnhtml) {
                layersAll();
                $('#form_layers input').val("");
                $('#form_layers input[type = submit]').val("Gravar");
            }
        });
        return false;
    } else {
        e.preventDefault();

        var form_data = $(this).serialize();
        var form_url = $(this).attr("action");
        var form_method = $(this).attr("method").toUpperCase();

        $.ajax({
            async: true,
            type: form_method,
            data: form_data,
            url: "/updatelayers/" + document.getElementById('id_layer').value,
            cache: false,
            success: function (data) {
                layersAll();
                $('#form_layers input').val("");
                $('#form_layers input[type = submit]').val("Gravar");
            }
        })
        return false;
    }
})

function layersAll() {
    var infoBox = document.getElementById('layers_ul');
    while (infoBox.firstChild)
        infoBox.removeChild(infoBox.firstChild);

    fetch("/layersAll")
        .then(res => res.json())
        .then((out) => {
            for (let i = 0; i < out.length; i++) {
                let infoLi = $('<li></li>');
                let colOcorrencia = $("<div class='row div_layers' onclick='layersAtivo(this)' data-name='" + out[i].nome + "' data-tabela='" + out[i].tabela + "' data-descricao='" + out[i].descricao + "' id='" + out[i].id + "'>"
                    + "<div style='width: 6%;'>"
                    + "Id: <strong>" + out[i].id + "</strong>"
                    + "</div>"
                    + "<div style='width: 40%;'>"
                    + "Nome: <strong>" + out[i].nome + "</strong>"
                    + "</div>"
                    + "<div style='width: 30%;'>"
                    + "Tabela: <strong>" + out[i].tabela + "</strong>"
                    + "</div>"
                    + "<did style='width: 7%;'>"
                    + "<button id='delete_ocorrencia' title='Excluir Ocorrência' onclick='delete_layer(" + out[i].id + ")' class='button'>"
                    + "<i class='far fa-trash-alt'></i>"
                    + "</button>"
                    + "</div>"
                    + "</div>");

                let linha = $("<hr width = '100%' size = '100' style='margin-top: .3rem;margin-bottom: .3rem;'>");
                infoLi.append(colOcorrencia);
                $('#layers_ul').append(infoLi, linha);
            }
        })
}

function delete_layer(id) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        var id = id;
        $.ajax({
            async: true,
            type: "GET",
            data: id,
            url: "/deletelayers/" + id,
            dataType: "json"
        });
        layersAll();
    } else {
        return false;
    }
}

function clearLayerInputs() {
    $('#form_layers input').val("");
    $('#form_layers input[type = submit]').val("Gravar");
}

/**Zoom das imagens */
(function ($) {
    var defaults = {
        cursorcolor: '255,255,255',
        opacity: 0.5,
        cursor: 'crosshair',
        zindex: 2147483647,
        zoomviewsize: [480, 480],
        zoomviewposition: 'right',
        zoomviewmargin: 10,
        zoomviewborder: 'none',
        magnification: 1.925
    };

    var imagezoomCursor, imagezoomView, settings, imageWidth, imageHeight, offset;
    var methods = {
        init: function (options) {
            $this = $(this),
                imagezoomCursor = $('.imagezoom-cursor'),
                imagezoomView = $('.imagezoom-view'),
                $(document).on('mouseenter', $this.selector, function (e) {
                    var data = $(this).data();
                    settings = $.extend({}, defaults, options, data),
                        offset = $(this).offset(),
                        imageWidth = $(this).width(),
                        imageHeight = $(this).height(),
                        cursorSize = [(settings.zoomviewsize[0] / settings.magnification), (settings.zoomviewsize[1] / settings.magnification)];
                    if (data.imagezoom == true) {
                        imageSrc = $(this).attr('src');
                    } else {
                        imageSrc = $(this).get(0).getAttribute('data-imagezoom');
                    }

                    var posX = e.pageX,
                        posY = e.pageY,
                        zoomViewPositionX;
                    $('body').prepend('<div class="imagezoom-cursor">&nbsp;</div><div class="imagezoom-view"><img src="' + imageSrc + '"></div>');

                    if (settings.zoomviewposition == 'right') {
                        zoomViewPositionX = (offset.left + imageWidth + settings.zoomviewmargin);
                    } else {
                        zoomViewPositionX = (offset.left - imageWidth - settings.zoomviewmargin);
                    }

                    $(imagezoomView.selector).css({
                        'position': 'absolute',
                        'left': zoomViewPositionX,
                        'top': offset.top,
                        'width': cursorSize[0] * settings.magnification,
                        'height': cursorSize[1] * settings.magnification,
                        'background': '#000',
                        'z-index': 2147483647,
                        'overflow': 'hidden',
                        'border': settings.zoomviewborder
                    });

                    $(imagezoomView.selector).children('img').css({
                        'position': 'absolute',
                        'width': imageWidth * settings.magnification,
                        'height': imageHeight * settings.magnification,
                    });

                    $(imagezoomCursor.selector).css({
                        'position': 'absolute',
                        'width': cursorSize[0],
                        'height': cursorSize[1],
                        'background-color': 'rgb(' + settings.cursorcolor + ')',
                        'z-index': settings.zindex,
                        'opacity': settings.opacity,
                        'cursor': settings.cursor
                    });
                    $(imagezoomCursor.selector).css({
                        'top': posY - (cursorSize[1] / 2),
                        'left': posX
                    });
                    $(document).on('mousemove', document.body, methods.cursorPos);
                });
        },
        cursorPos: function (e) {
            var posX = e.pageX,
                posY = e.pageY;
            if (posY < offset.top || posX < offset.left || posY > (offset.top + imageHeight) || posX > (offset.left + imageWidth)) {
                $(imagezoomCursor.selector).remove();
                $(imagezoomView.selector).remove();
                return;
            }

            if (posX - (cursorSize[0] / 2) < offset.left) {
                posX = offset.left + (cursorSize[0] / 2);
            } else if (posX + (cursorSize[0] / 2) > offset.left + imageWidth) {
                posX = (offset.left + imageWidth) - (cursorSize[0] / 2);
            }

            if (posY - (cursorSize[1] / 2) < offset.top) {
                posY = offset.top + (cursorSize[1] / 2);
            } else if (posY + (cursorSize[1] / 2) > offset.top + imageHeight) {
                posY = (offset.top + imageHeight) - (cursorSize[1] / 2);
            }

            $(imagezoomCursor.selector).css({
                'top': posY - (cursorSize[1] / 2),
                'left': posX - (cursorSize[0] / 2)
            });
            $(imagezoomView.selector).children('img').css({
                'top': ((offset.top - posY) + (cursorSize[1] / 2)) * settings.magnification,
                'left': ((offset.left - posX) + (cursorSize[0] / 2)) * settings.magnification
            });

            $(imagezoomCursor.selector).mouseleave(function () {
                $(this).remove();
            });
        }
    };

    $.fn.imageZoom = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error(method);
        }
    }

    $(document).ready(function () {
        $('.foto_zoom, .img').imageZoom();
    });
})(jQuery);

async function telaBackup() {
    document.getElementById('backup_ul').innerHTML = "";
    await fetch("/backup/all")
        .then(res => res.json())
        .then((out) => {
            for (let i = 0; i < out.length; i++) {
                let status = out[i].status == 1 ? 'Iniciado' : out[i].status == 2 ? 'Concluído' : 'erro';
                let cor = status == 'Iniciado' ? '#F7DC3D' : status == 'Concluído' ? '#3eb337' : '#E55923';
                let infoLi = $('<li></li>');
                let backup = "<div class='div_backup'>"
                    + "Data: <strong>" + out[i].dt_hr + "</strong>"
                    + "<a href='/backup/download?dt_hr=" + out[i].dt_hr + "' download style='color:" + cor
                    + ";float: right;font-weight: bold;' title='Fazer Download do arquivo.'>";
                backup += (status == 'Concluído') ? "<i class='fas fa-download'></i>" : "";
                backup += " " + status + "</a>"
                    + "</div>";
                infoLi.html(backup);
                let linha = $("<hr style='margin-top: 0.2rem;margin-bottom: 0.2rem;width: 100%;'>");
                $('#backup_ul').append(infoLi, linha);
            }
        })
    abrirModal('#modal_backup');
}

async function creatBackup() {
    await fetch("/backup/create")
        .then(res => res.json())
        .then((out) => {
            telaBackup();
        })
}

async function download_backup(dt_hr) {
    await fetch("/backup/download" + "?" + "dt_hr=" + dt_hr)
}

function zoom(id, percent) {
    document.getElementById(id).style.transform = 'scale(' + percent / 100 + ')';
}

function nextPage(status) {
    if (!status) {
        document.getElementById("row_1").style.display = 'none';
        document.getElementById("row_2").style.display = 'contents';
    }else{
        document.getElementById("row_1").style.display = 'contents';
        document.getElementById("row_2").style.display = 'none';
    }
}

function cad_laboratorio_nextPage(status) {
    if (!status) {
        document.getElementById("cad_laboratorio_row_1").style.display = 'none';
        document.getElementById("cad_laboratorio_row_2").style.display = 'contents';
    }else{
        document.getElementById("cad_laboratorio_row_1").style.display = 'contents';
        document.getElementById("cad_laboratorio_row_2").style.display = 'none';
    }
}

function saveResumoLab(){
    let inputs = document.querySelector("#cad_laboratorio_form").querySelectorAll("input"); 
    var formData = {};
    for(const input of inputs){
        if(input.type == 'checkbox')
            formData[input.name] = input.checked;
        else
            formData[input.name] = input.value;
    }
    
    let url="/resumolab/create";

    if(formData['id'])
        url = "/resumolab/create/"+formData['id'];
    
    saveResumoLabData(url, formData);
}

function saveResumoLabData(url, formData){
    fetch(url, {
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => {
        if(data.status != 'ok'){
            throw data.error;
        }
        alert(data.message);
        clearResumoLabInputs();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function resumoLab() {
    //updatePesquisaSessionStorage();

    /*document.getElementById('btnStatusFiltro').setAttribute('style', "color: green");
    if ($('#modal_legenda_tipo_ocorrencia').is(':visible')) {
        paint_map();
    }*/

    let inputs = document.querySelector("#pesquisa-avancada_laboratorio-form").querySelectorAll("input,select");
    var formData = {};
    for (const input of inputs) {
        if (input.type == 'checkbox')
            formData[input.name] = input.checked;
        else
            formData[input.name] = input.value;
    }

    fetch("/resumolab/search", {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)//JSON.stringify(Object.fromEntries(formData))
    })
        .then(res => res.json())
        .then((out) => {
            if (out.status == 'ok') {
                //console.log('Ok! ' , out);

                if (!out.data){
                    alert('Nenhum dado encontrado!');
                    limpar_pesquisa_resumoLab();
                }

                //**** Número de depósitos com espécimes por tipo/Com Aedes aegypti ****
                let a1_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.a1_aegypti, 10) || 0;
                }, 0);
                let a2_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.a2_aegypti, 10) || 0;
                }, 0);
                let b_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.b_aegypti, 10) || 0;
                }, 0);
                let c1_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.c1_aegypti, 10) || 0;
                }, 0);
                let d1_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.d1_aegypti, 10) || 0;
                }, 0);
                let d2_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.d2_aegypti, 10) || 0;
                }, 0);
                let e_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.e_aegypti, 10) || 0;
                }, 0);
                let total_aegypti = a1_aegypti+a2_aegypti+b_aegypti+c1_aegypti+d1_aegypti+d2_aegypti+e_aegypti;


                //**** Número de depósitos com espécimes por tipo/Com Aedes albopictus ****
                let a1_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.a1_albopictus, 10) || 0;
                }, 0);
                let a2_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.a2_albopictus, 10) || 0;
                }, 0);
                let b_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.b_albopictus, 10) || 0;
                }, 0);
                let c1_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.c1_albopictus, 10) || 0;
                }, 0);
                let d1_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.d1_albopictus, 10) || 0;
                }, 0);
                let d2_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.d2_albopictus, 10) || 0;
                }, 0);
                let e_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.e_albopictus, 10) || 0;
                }, 0);
                let total_albopictus = a1_albopictus+a2_albopictus+b_albopictus+c1_albopictus+d1_albopictus+d2_albopictus+e_albopictus;

                //**** Número de imóveis com espécimes por tipo / Com Aedes aegypti ****
                let r_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.r_aegypti, 10) || 0;
                }, 0);
                let c2_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.c2_aegypti, 10) || 0;
                }, 0);
                let tb_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.tb_aegypti, 10) || 0;
                }, 0);
                let pe_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.pe_aegypti, 10) || 0;
                }, 0);
                let o_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.o_aegypti, 10) || 0;
                }, 0);
                let total_imoveis_aegypti = r_aegypti + c2_aegypti + tb_aegypti + pe_aegypti + o_aegypti;

                //**** Número de imóveis com espécimes por tipo / Com Aedes albopictus ****
                let r_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.r_albopictus, 10) || 0;
                }, 0);
                let c2_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.c2_albopictus, 10) || 0;
                }, 0);
                let tb_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.tb_albopictus, 10) || 0;
                }, 0);
                let pe_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.pe_albopictus, 10) || 0;
                }, 0);
                let o_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.o_albopictus, 10) || 0;
                }, 0);
                let total_imoveis_albopictus = r_albopictus + c2_albopictus + tb_albopictus + pe_albopictus + o_albopictus;

                //**** Número de imóveis com espécimes por tipo / Outros****
                let r_outros = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.r_outros, 10) || 0;
                }, 0);
                let c_outros = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.c_outros, 10) || 0;
                }, 0);
                let tb_outros = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.tb_outros, 10) || 0;
                }, 0);
                let pe_outros = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.pe_outros, 10) || 0;
                }, 0);
                let o_outros = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.o_outros, 10) || 0;
                }, 0);
                let total_outros = r_outros + c_outros + tb_outros + pe_outros + o_outros;

                //**** Número de exemplares Larvas ****
                let larvas_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.larvas_aegypti, 10) || 0;
                }, 0);
                let larvas_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.larvas_albopictus, 10) || 0;
                }, 0);
                let larvas_outros = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.larvas_outros, 10) || 0;
                }, 0);

                //**** Número de exemplares Pupas ****
                let pupas_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.pupas_aegypti, 10) || 0;
                }, 0);
                let pupas_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.pupas_albopictus, 10) || 0;
                }, 0);
                let pupas_outros = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.pupas_outros, 10) || 0;
                }, 0);

                //**** Número de exemplares Ex. pupa ****
                let expupa_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.expupa_aegypti, 10) || 0;
                }, 0);
                let expupa_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.expupa_albopictus, 10) || 0;
                }, 0);
                let expupa_outros = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.expupa_outros, 10) || 0;
                }, 0);

                //**** Número de exemplares Ex. Adultos ****
                let adultos_aegypti = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.adultos_aegypti, 10) || 0;
                }, 0);
                let adultos_albopictus = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.adultos_albopictus, 10) || 0;
                }, 0);
                let adultos_outros = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.adultos_outros, 10) || 0;
                }, 0);

                //**** N. e sequência de quarteirão */
                //**** Com Aedes aegypti */
                let quart_aegypti_1 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_1, 10) || 0;
                }, 0);
                let quart_aegypti_2 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_2, 10) || 0;
                }, 0);
                let quart_aegypti_3 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_3, 10) || 0;
                }, 0);                
                let quart_aegypti_4 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_4, 10) || 0;
                }, 0);
                let quart_aegypti_5 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_5, 10) || 0;
                }, 0);
                let quart_aegypti_6 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_6, 10) || 0;
                }, 0);
                let quart_aegypti_7 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_7, 10) || 0;
                }, 0);                
                let quart_aegypti_8 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_8, 10) || 0;
                }, 0);
                let quart_aegypti_9 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_9, 10) || 0;
                }, 0);
                let quart_aegypti_10 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_10, 10) || 0;
                }, 0);
                let quart_aegypti_11 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_11, 10) || 0;
                }, 0);
                let quart_aegypti_12 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_12, 10) || 0;
                }, 0);
                let quart_aegypti_13 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_13, 10) || 0;
                }, 0);
                let quart_aegypti_14 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_14, 10) || 0;
                }, 0);
                let quart_aegypti_15 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_15, 10) || 0;
                }, 0);
                let quart_aegypti_16 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_16, 10) || 0;
                }, 0);
                let quart_aegypti_17 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_17, 10) || 0;
                }, 0);
                let quart_aegypti_18 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_18, 10) || 0;
                }, 0);
                let quart_aegypti_19 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_19, 10) || 0;
                }, 0);
                let quart_aegypti_20 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_20, 10) || 0;
                }, 0);
                let quart_aegypti_21 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_21, 10) || 0;
                }, 0);
                let quart_aegypti_22 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_22, 10) || 0;
                }, 0);
                let quart_aegypti_23 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_23, 10) || 0;
                }, 0);
                let quart_aegypti_24 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_24, 10) || 0;
                }, 0);
                let quart_aegypti_25 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_25, 10) || 0;
                }, 0);
                let quart_aegypti_26 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_26, 10) || 0;
                }, 0);
                let quart_aegypti_27 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_27, 10) || 0;
                }, 0);
                let quart_aegypti_28 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegypti_28, 10) || 0;
                }, 0);

                //**** Com Aedes albopictus */
                let quart_albopictus_1 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_1, 10) || 0;
                }, 0);
                let quart_albopictus_2 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_2, 10) || 0;
                }, 0);
                let quart_albopictus_3 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_3, 10) || 0;
                }, 0);                
                let quart_albopictus_4 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_4, 10) || 0;
                }, 0);
                let quart_albopictus_5 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_5, 10) || 0;
                }, 0);
                let quart_albopictus_6 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_6, 10) || 0;
                }, 0);
                let quart_albopictus_7 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_7, 10) || 0;
                }, 0);                
                let quart_albopictus_8 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_8, 10) || 0;
                }, 0);
                let quart_albopictus_9 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_9, 10) || 0;
                }, 0);
                let quart_albopictus_10 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_10, 10) || 0;
                }, 0);
                let quart_albopictus_11 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_11, 10) || 0;
                }, 0);
                let quart_albopictus_12 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_12, 10) || 0;
                }, 0);
                let quart_albopictus_13 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_13, 10) || 0;
                }, 0);
                let quart_albopictus_14 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_14, 10) || 0;
                }, 0);
                let quart_albopictus_15 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_15, 10) || 0;
                }, 0);
                let quart_albopictus_16 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_16, 10) || 0;
                }, 0);
                let quart_albopictus_17 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_17, 10) || 0;
                }, 0);
                let quart_albopictus_18 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_18, 10) || 0;
                }, 0);
                let quart_albopictus_19 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_19, 10) || 0;
                }, 0);
                let quart_albopictus_20 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_20, 10) || 0;
                }, 0);
                let quart_albopictus_21 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_21, 10) || 0;
                }, 0);
                let quart_albopictus_22 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_22, 10) || 0;
                }, 0);
                let quart_albopictus_23 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_23, 10) || 0;
                }, 0);
                let quart_albopictus_24 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_24, 10) || 0;
                }, 0);
                let quart_albopictus_25 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_25, 10) || 0;
                }, 0);
                let quart_albopictus_26 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_26, 10) || 0;
                }, 0);
                let quart_albopictus_27 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_27, 10) || 0;
                }, 0);
                let quart_albopictus_28 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_albopictus_28, 10) || 0;
                }, 0);

                //**** Com Aedes aegypti + Aedes albopictus */
                let quart_aegy_alb_1 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_1, 10) || 0;
                }, 0);
                let quart_aegy_alb_2 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_2, 10) || 0;
                }, 0);
                let quart_aegy_alb_3 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_3, 10) || 0;
                }, 0);                
                let quart_aegy_alb_4 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_4, 10) || 0;
                }, 0);
                let quart_aegy_alb_5 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_5, 10) || 0;
                }, 0);
                let quart_aegy_alb_6 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_6, 10) || 0;
                }, 0);
                let quart_aegy_alb_7 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_7, 10) || 0;
                }, 0);                
                let quart_aegy_alb_8 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_8, 10) || 0;
                }, 0);
                let quart_aegy_alb_9 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_9, 10) || 0;
                }, 0);
                let quart_aegy_alb_10 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_10, 10) || 0;
                }, 0);
                let quart_aegy_alb_11 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_11, 10) || 0;
                }, 0);
                let quart_aegy_alb_12 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_12, 10) || 0;
                }, 0);
                let quart_aegy_alb_13 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_13, 10) || 0;
                }, 0);
                let quart_aegy_alb_14 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_14, 10) || 0;
                }, 0);
                let quart_aegy_alb_15 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_15, 10) || 0;
                }, 0);
                let quart_aegy_alb_16 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_16, 10) || 0;
                }, 0);
                let quart_aegy_alb_17 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_17, 10) || 0;
                }, 0);
                let quart_aegy_alb_18 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_18, 10) || 0;
                }, 0);
                let quart_aegy_alb_19 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_19, 10) || 0;
                }, 0);
                let quart_aegy_alb_20 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_20, 10) || 0;
                }, 0);
                let quart_aegy_alb_21 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_21, 10) || 0;
                }, 0);
                let quart_aegy_alb_22 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_22, 10) || 0;
                }, 0);
                let quart_aegy_alb_23 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_23, 10) || 0;
                }, 0);
                let quart_aegy_alb_24 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_24, 10) || 0;
                }, 0);
                let quart_aegy_alb_25 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_25, 10) || 0;
                }, 0);
                let quart_aegy_alb_26 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_26, 10) || 0;
                }, 0);
                let quart_aegy_alb_27 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_27, 10) || 0;
                }, 0);
                let quart_aegy_alb_28 = [].reduce.call(out.data, function (somatorio, el) {
                    return somatorio + parseInt(el.quart_aegy_alb_28, 10) || 0;
                }, 0);

                
                //**** Número de depósitos com espécimes por tipo/Com Aedes aegypti ****                 
                document.getElementById("tela01_01").value = a1_aegypti != null ? a1_aegypti : '0';
                document.getElementById("tela01_02").value = a2_aegypti != null ? a2_aegypti : '0';
                document.getElementById("tela01_03").value = b_aegypti != null ? b_aegypti : '0';
                document.getElementById("tela01_04").value = c1_aegypti != null ? c1_aegypti : '0';
                document.getElementById("tela01_05").value = d1_aegypti != null ? d1_aegypti : '0';
                document.getElementById("tela01_06").value = d2_aegypti != null ? d2_aegypti : '0';
                document.getElementById("tela01_07").value = e_aegypti != null ? e_aegypti : '0';
                document.getElementById("tela01_08").value = total_aegypti != null ? total_aegypti : '0';

                //**** Número de depósitos com espécimes por tipo/Com Aedes albopictus ****                 
                document.getElementById("tela01_09").value = a1_albopictus != null ? a1_albopictus : '0';
                document.getElementById("tela01_10").value = a2_albopictus != null ? a2_albopictus : '0';
                document.getElementById("tela01_11").value = b_albopictus != null ? b_albopictus : '0';
                document.getElementById("tela01_12").value = c1_albopictus != null ? c1_albopictus : '0';
                document.getElementById("tela01_13").value = d1_albopictus != null ? d1_albopictus : '0';
                document.getElementById("tela01_14").value = d2_albopictus != null ? d2_albopictus : '0';
                document.getElementById("tela01_15").value = e_albopictus != null ? e_albopictus : '0';
                document.getElementById("tela01_16").value = total_albopictus != null ? total_albopictus : '0';

                //**** Número de imóveis com espécimes por tipo / Com Aedes aegypti ****                 
                document.getElementById("tela01_17").value = r_aegypti != null ? r_aegypti : '0';
                document.getElementById("tela01_18").value = c2_aegypti != null ? c2_aegypti : '0';
                document.getElementById("tela01_19").value = tb_aegypti != null ? tb_aegypti : '0';
                document.getElementById("tela01_20").value = pe_aegypti != null ? pe_aegypti : '0';
                document.getElementById("tela01_21").value = o_aegypti != null ? o_aegypti : '0';
                document.getElementById("tela01_22").value = total_imoveis_aegypti != null ? total_imoveis_aegypti : '0';

                //**** Número de imóveis com espécimes por tipo / Com Aedes albopictus ****                 
                document.getElementById("tela01_23").value = r_albopictus != null ? r_albopictus : '0';
                document.getElementById("tela01_24").value = c2_albopictus != null ? c2_albopictus : '0';
                document.getElementById("tela01_25").value = tb_albopictus != null ? tb_albopictus : '0';
                document.getElementById("tela01_26").value = pe_albopictus != null ? pe_albopictus : '0';
                document.getElementById("tela01_27").value = o_albopictus != null ? o_albopictus : '0';
                document.getElementById("tela01_28").value = total_imoveis_albopictus != null ? total_imoveis_albopictus : '0';

                //**** Número de imóveis com espécimes por tipo / Outros ****                 
                document.getElementById("tela01_29").value = r_outros != null ? r_outros : '0';
                document.getElementById("tela01_30").value = c_outros != null ? c_outros : '0';
                document.getElementById("tela01_31").value = tb_outros != null ? tb_outros : '0';
                document.getElementById("tela01_32").value = pe_outros != null ? pe_outros : '0';
                document.getElementById("tela01_33").value = o_outros != null ? o_outros : '0';
                document.getElementById("tela01_34").value = total_outros != null ? total_outros : '0';

                //**** Número de exemplares Larvas **** 
                document.getElementById("tela01_35").value = larvas_aegypti != null ? larvas_aegypti : '0';
                document.getElementById("tela01_39").value = larvas_albopictus != null ? larvas_albopictus : '0';
                document.getElementById("tela01_43").value = larvas_outros != null ? larvas_outros : '0';

                //**** Número de exemplares Pupas **** 
                document.getElementById("tela01_36").value = pupas_aegypti != null ? pupas_aegypti : '0';
                document.getElementById("tela01_40").value = pupas_albopictus != null ? pupas_albopictus : '0';
                document.getElementById("tela01_44").value = pupas_outros != null ? pupas_outros : '0';

                //**** Número de exemplares Ex. pupa **** 
                document.getElementById("tela01_37").value = expupa_aegypti != null ? expupa_aegypti : '0';
                document.getElementById("tela01_41").value = expupa_albopictus != null ? expupa_albopictus : '0';
                document.getElementById("tela01_45").value = expupa_outros != null ? expupa_outros : '0';

                //**** Número de exemplares Ex. Adultos **** 
                document.getElementById("tela01_38").value = adultos_aegypti != null ? adultos_aegypti : '0';
                document.getElementById("tela01_42").value = adultos_albopictus != null ? adultos_albopictus : '0';
                document.getElementById("tela01_46").value = adultos_outros != null ? adultos_outros : '0';

                //**** N. e sequência de quarteirão */
                //**** Com Aedes aegypti */
                document.getElementById("tela02_01").value = quart_aegypti_1 != null ? quart_aegypti_1 : '0';
                document.getElementById("tela02_02").value = quart_aegypti_2 != null ? quart_aegypti_2 : '0';
                document.getElementById("tela02_03").value = quart_aegypti_3 != null ? quart_aegypti_3 : '0';
                document.getElementById("tela02_04").value = quart_aegypti_4 != null ? quart_aegypti_4 : '0';
                document.getElementById("tela02_05").value = quart_aegypti_5 != null ? quart_aegypti_5 : '0';
                document.getElementById("tela02_06").value = quart_aegypti_6 != null ? quart_aegypti_6 : '0';
                document.getElementById("tela02_07").value = quart_aegypti_7 != null ? quart_aegypti_7 : '0';
                document.getElementById("tela02_08").value = quart_aegypti_8 != null ? quart_aegypti_8 : '0';
                document.getElementById("tela02_09").value = quart_aegypti_9 != null ? quart_aegypti_9 : '0';
                document.getElementById("tela02_10").value = quart_aegypti_10 != null ? quart_aegypti_10 : '0';
                document.getElementById("tela02_11").value = quart_aegypti_11 != null ? quart_aegypti_11 : '0';
                document.getElementById("tela02_12").value = quart_aegypti_12 != null ? quart_aegypti_12 : '0';
                document.getElementById("tela02_13").value = quart_aegypti_13 != null ? quart_aegypti_13 : '0';
                document.getElementById("tela02_14").value = quart_aegypti_14 != null ? quart_aegypti_14 : '0';
                document.getElementById("tela02_15").value = quart_aegypti_15 != null ? quart_aegypti_15 : '0';
                document.getElementById("tela02_16").value = quart_aegypti_16 != null ? quart_aegypti_16 : '0';
                document.getElementById("tela02_17").value = quart_aegypti_17 != null ? quart_aegypti_17 : '0';
                document.getElementById("tela02_18").value = quart_aegypti_18 != null ? quart_aegypti_18 : '0';
                document.getElementById("tela02_19").value = quart_aegypti_19 != null ? quart_aegypti_19 : '0';
                document.getElementById("tela02_20").value = quart_aegypti_20 != null ? quart_aegypti_20 : '0';
                document.getElementById("tela02_21").value = quart_aegypti_21 != null ? quart_aegypti_21 : '0';
                document.getElementById("tela02_22").value = quart_aegypti_22 != null ? quart_aegypti_22 : '0';
                document.getElementById("tela02_23").value = quart_aegypti_23 != null ? quart_aegypti_23 : '0';
                document.getElementById("tela02_24").value = quart_aegypti_24 != null ? quart_aegypti_24 : '0';
                document.getElementById("tela02_25").value = quart_aegypti_25 != null ? quart_aegypti_25 : '0';
                document.getElementById("tela02_26").value = quart_aegypti_26 != null ? quart_aegypti_26 : '0';
                document.getElementById("tela02_27").value = quart_aegypti_27 != null ? quart_aegypti_27 : '0';
                document.getElementById("tela02_28").value = quart_aegypti_28 != null ? quart_aegypti_28 : '0';

                //**** Com Aedes albopictus */
                document.getElementById("tela02_29").value = quart_albopictus_1 != null ? quart_albopictus_1 : '0';
                document.getElementById("tela02_30").value = quart_albopictus_2 != null ? quart_albopictus_2 : '0';
                document.getElementById("tela02_31").value = quart_albopictus_3 != null ? quart_albopictus_3 : '0';
                document.getElementById("tela02_32").value = quart_albopictus_4 != null ? quart_albopictus_4 : '0';
                document.getElementById("tela02_33").value = quart_albopictus_5 != null ? quart_albopictus_5 : '0';
                document.getElementById("tela02_34").value = quart_albopictus_6 != null ? quart_albopictus_6 : '0';
                document.getElementById("tela02_35").value = quart_albopictus_7 != null ? quart_albopictus_7 : '0';
                document.getElementById("tela02_36").value = quart_albopictus_8 != null ? quart_albopictus_8 : '0';
                document.getElementById("tela02_37").value = quart_albopictus_9 != null ? quart_albopictus_9 : '0';
                document.getElementById("tela02_38").value = quart_albopictus_10 != null ? quart_albopictus_10 : '0';
                document.getElementById("tela02_39").value = quart_albopictus_11 != null ? quart_albopictus_11 : '0';
                document.getElementById("tela02_40").value = quart_albopictus_12 != null ? quart_albopictus_12 : '0';
                document.getElementById("tela02_41").value = quart_albopictus_13 != null ? quart_albopictus_13 : '0';
                document.getElementById("tela02_42").value = quart_albopictus_14 != null ? quart_albopictus_14 : '0';
                document.getElementById("tela02_43").value = quart_albopictus_15 != null ? quart_albopictus_15 : '0';
                document.getElementById("tela02_44").value = quart_albopictus_16 != null ? quart_albopictus_16 : '0';
                document.getElementById("tela02_45").value = quart_albopictus_17 != null ? quart_albopictus_17 : '0';
                document.getElementById("tela02_46").value = quart_albopictus_18 != null ? quart_albopictus_18 : '0';
                document.getElementById("tela02_47").value = quart_albopictus_19 != null ? quart_albopictus_19 : '0';
                document.getElementById("tela02_48").value = quart_albopictus_20 != null ? quart_albopictus_20 : '0';
                document.getElementById("tela02_49").value = quart_albopictus_21 != null ? quart_albopictus_21 : '0';
                document.getElementById("tela02_50").value = quart_albopictus_22 != null ? quart_albopictus_22 : '0';
                document.getElementById("tela02_51").value = quart_albopictus_23 != null ? quart_albopictus_23 : '0';
                document.getElementById("tela02_52").value = quart_albopictus_24 != null ? quart_albopictus_24 : '0';
                document.getElementById("tela02_53").value = quart_albopictus_25 != null ? quart_albopictus_25 : '0';
                document.getElementById("tela02_54").value = quart_albopictus_26 != null ? quart_albopictus_26 : '0';
                document.getElementById("tela02_55").value = quart_albopictus_27 != null ? quart_albopictus_27 : '0';
                document.getElementById("tela02_56").value = quart_albopictus_28 != null ? quart_albopictus_28 : '0';

                //**** Com Aedes aegypti + Aedes albopictus */
                document.getElementById("tela02_57").value = quart_aegy_alb_1 != null ? quart_aegy_alb_1 : '0';
                document.getElementById("tela02_58").value = quart_aegy_alb_2 != null ? quart_aegy_alb_2 : '0';
                document.getElementById("tela02_59").value = quart_aegy_alb_3 != null ? quart_aegy_alb_3 : '0';
                document.getElementById("tela02_60").value = quart_aegy_alb_4 != null ? quart_aegy_alb_4 : '0';
                document.getElementById("tela02_61").value = quart_aegy_alb_5 != null ? quart_aegy_alb_5 : '0';
                document.getElementById("tela02_62").value = quart_aegy_alb_6 != null ? quart_aegy_alb_6 : '0';
                document.getElementById("tela02_63").value = quart_aegy_alb_7 != null ? quart_aegy_alb_7 : '0';
                document.getElementById("tela02_64").value = quart_aegy_alb_8 != null ? quart_aegy_alb_8 : '0';
                document.getElementById("tela02_65").value = quart_aegy_alb_9 != null ? quart_aegy_alb_9 : '0';
                document.getElementById("tela02_66").value = quart_aegy_alb_10 != null ? quart_aegy_alb_10 : '0';
                document.getElementById("tela02_67").value = quart_aegy_alb_11 != null ? quart_aegy_alb_11 : '0';
                document.getElementById("tela02_68").value = quart_aegy_alb_12 != null ? quart_aegy_alb_12 : '0';
                document.getElementById("tela02_69").value = quart_aegy_alb_13 != null ? quart_aegy_alb_13 : '0';
                document.getElementById("tela02_70").value = quart_aegy_alb_14 != null ? quart_aegy_alb_14 : '0';
                document.getElementById("tela02_71").value = quart_aegy_alb_15 != null ? quart_aegy_alb_15 : '0';
                document.getElementById("tela02_72").value = quart_aegy_alb_16 != null ? quart_aegy_alb_16 : '0';
                document.getElementById("tela02_73").value = quart_aegy_alb_17 != null ? quart_aegy_alb_17 : '0';
                document.getElementById("tela02_74").value = quart_aegy_alb_18 != null ? quart_aegy_alb_18 : '0';
                document.getElementById("tela02_75").value = quart_aegy_alb_19 != null ? quart_aegy_alb_19 : '0';
                document.getElementById("tela02_76").value = quart_aegy_alb_20 != null ? quart_aegy_alb_20 : '0';
                document.getElementById("tela02_77").value = quart_aegy_alb_21 != null ? quart_aegy_alb_21 : '0';
                document.getElementById("tela02_78").value = quart_aegy_alb_22 != null ? quart_aegy_alb_22 : '0';
                document.getElementById("tela02_79").value = quart_aegy_alb_23 != null ? quart_aegy_alb_23 : '0';
                document.getElementById("tela02_80").value = quart_aegy_alb_24 != null ? quart_aegy_alb_24 : '0';
                document.getElementById("tela02_81").value = quart_aegy_alb_25 != null ? quart_aegy_alb_25 : '0';
                document.getElementById("tela02_82").value = quart_aegy_alb_26 != null ? quart_aegy_alb_26 : '0';
                document.getElementById("tela02_83").value = quart_aegy_alb_27 != null ? quart_aegy_alb_27 : '0';
                document.getElementById("tela02_84").value = quart_aegy_alb_28 != null ? quart_aegy_alb_28 : '0';

            }
            else {
                console.log('Error! ' + out.status);
            }
        });
}

function limpar_pesquisa_resumoLab() {
    clearChildren(document.getElementById("pesquisa-avancada_laboratorio-form"));
    clearChildren(document.getElementById("resumo_laboratorio"));
    clearChildren(document.getElementById("resumo_laboratorio_2"));
    clearChildren(document.getElementById("resumo_laboratorio_3"));

    //document.getElementById('btnStatusFiltro').setAttribute('style', "color: red");
    /*sessionStorage.setItem('pesquisa_avancada', '');
    if ($('#modal_legenda_tipo_ocorrencia').is(':visible')) {
        paint_map();
    } else {
        desmarcaColor();
    }
    fechaModal("#pesquisa_avancada_resumo");
    fechaModal('#pesquisa_avancada_resumo_2');
    document.getElementById('pesquisa_avancada_ul').innerHTML = "";
    document.getElementById('tab_pesquisa_avancada').hidden = true;
    document.getElementById('footer_pesquisa').innerHTML = "";
    document.getElementById('grafico_bar').setAttribute('style', "display: block; pointer-events: none;");*/
}

function clearResumoLabInputs(){
    inputs = document.querySelector("#cad_laboratorio_form").querySelectorAll('input'); 
    for (const input of inputs){
        input.value = '';
    }
}

function carregaInfoPesquisaResumoLab() {
    if (!sessionStorage.getItem('pesquisa_avancada')) {
        document.getElementById("form_pesquisa_avancada_dataIni").valueAsDate = new Date();
        document.getElementById("form_pesquisa_avancada_dataFim").valueAsDate = new Date();
    }

    preencheComboAgentesResumoLab();
    preencheComboMunicipioResumoLab();
    preencheComboUfResumoLab();
    preencheComboLocalidadeResumoLab();
}

function preencheComboAgentesResumoLab() {
    let comboAgente = document.getElementById("form_pesquisa_avancada_laboratorio_agente");
    let inner = '<option value=""/>';
    buscarAgentesResumoLab((agentes) => {
        for (agente of agentes)
            inner += "<option value=" + agente.agente + ">" + agente.agente + "</option>";
        comboAgente.innerHTML = inner;
    });
}

function preencheComboMunicipioResumoLab() {
    let comboMunicipio = document.getElementById("form_pesquisa_avancada_laboratorio_municipio");
    let inner = '<option value=""/>';
    buscarMunicipioResumoLab((municipios) => {
        for (municipio of municipios)
            inner += "<option value=" + municipio.municipio + ">" + municipio.municipio + "</option>";
            comboMunicipio.innerHTML = inner;
    });
}

function preencheComboUfResumoLab() {
    let comboUf = document.getElementById("form_pesquisa_avancada_laboratorio_uf");
    let inner = '<option value=""/>';
    buscarUfResumoLab((ufs) => {
        for (uf of ufs)
            inner += "<option value=" + uf.uf + ">" + uf.uf + "</option>";
            comboUf.innerHTML = inner;
    });
}

function preencheComboLocalidadeResumoLab() {
    let comboUf = document.getElementById("form_pesquisa_avancada_laboratorio_localidade");
    let inner = '<option value=""/>';
    buscarLocalidadeResumoLab((localidades) => {
        for (localidade of localidades)
            inner += "<option value=" + localidade.localidade + ">" + localidade.localidade + "</option>";
            comboUf.innerHTML = inner;
    });
}

function buscarAgentesResumoLab(afterFunction) {
    fetch('/resumolab/agentes')
        .then(res => res.json())
        .then((out) => {
            if (out.status != 'ok') {
                throw out.error;
            }

            if (afterFunction)
                afterFunction(out.data);
        });
}

function buscarMunicipioResumoLab(afterFunction) {
    fetch('/resumolab/municipio')
        .then(res => res.json())
        .then((out) => {
            if (out.status != 'ok') {
                throw out.error;
            }

            if (afterFunction)
                afterFunction(out.data);
        });
}

function buscarUfResumoLab(afterFunction) {
    fetch('/resumolab/uf')
        .then(res => res.json())
        .then((out) => {
            if (out.status != 'ok') {
                throw out.error;
            }

            if (afterFunction)
                afterFunction(out.data);
        });
}

function buscarLocalidadeResumoLab(afterFunction) {
    fetch('/resumolab/uf')
        .then(res => res.json())
        .then((out) => {
            if (out.status != 'ok') {
                throw out.error;
            }

            if (afterFunction)
                afterFunction(out.data);
        });
}