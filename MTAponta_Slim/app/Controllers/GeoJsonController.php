<?php

namespace App\Controllers;

use App\Controllers\Controller;
use App\Models\OcorrenciaColeta;
use App\Third\Giap;
use App\Models\Principal;

class GeoJsonController extends Controller
{
    public function lote($request, $response, $args)
    {
        try {
            $tile = '';
            $sth = $this->pdo->prepare("WITH outro AS ( SELECT geom AS shape, m.id as cod_ocorrencia, id, l.nome_declarante, l.nome_proprietario,
            (select count(*) as TOTAL from MT_COLETAS where INSCRICAO = insclote) as total, 
            l.nome_logradouro, l.n_predial, insclote as inscricao, i.codlogradouro from geom_lote left join ocorrencia m on m.inscricao = insclote 
            left join principal l on l.inscricao ILIKE concat(insclote,'_%') left join tbimobiliario i on i.inscricao ILIKE concat(insclote,'_%')
            WHERE  st_contains(geom, st_transform(ST_SetSrid('POINT(" . $request->getParam('lat') . ' ' . $request->getParam('long') . ")'::geometry,3857),31983)) limit 1 ) 
            ( SELECT row_to_json(t)as coordenada FROM (SELECT 'FeatureCollection' AS type,array_to_json(array_agg(row_to_json(m))) AS features from (
            select row_to_json(p) from (select 'Feature' AS type, ST_AsGeoJSON(st_transform(shape,3857))::json AS geometry, row_to_json(
            row(inscricao, nome_declarante, id, nome_logradouro, n_predial, nome_proprietario, cod_ocorrencia, codlogradouro, total)) as properties from outro)p)m)t)
            ");
            $sth->execute();

            $tile = $sth->fetchALL();
            $data = json_decode($tile[0]['coordenada']);

            $dados = '';

            if (!isset($data->features[0]))
                throw new \Exception("Inscrição não encontrada na coordenada.");

            if (isset($data->features[0]->geometry)) {
                $dados = $data->features[0];
            } else {
                $dados = $data->features[0]->row_to_json;
            };

            return $response->withHeader('Access-Control-Allow-Origin', '*')
                ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
                ->withJson($dados);
        } catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function centro($request, $response, $args)
    {
        try {
            $sth = $this->pdo->prepare("SELECT avg(st_x(geom)) as x, avg(st_y(geom)) as y from (
                select st_transform(st_centroid(st_collect(st_envelope(geom)))::geometry,3857) as geom from geom_lote)g");

            $sth->execute();

            $tile = $sth->fetch();
            $returnValue = [floatval($tile['x']), floatval($tile['y'])];

            return $response->withAddedHeader('Access-Control-Allow-Origin', '*')->withJson($returnValue);
        } catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function getLoteCentroid($request, $response, $args)
    {
        try {

            $sth = $this->pdo->prepare("SELECT st_x(geom) as x, st_y(geom) as y from (
                select st_transform(st_centroid(geom)::geometry, 3857) as geom from geom_lote where (insclote::text) like left(:inscricao, 12))g");

            $sth->execute([':inscricao' => $request->getParam('inscricao') . '%']);

            /*print_r($sth);
            die;

            if ($sth->rowCount() == 0) {
                throw new \Exception("Lote não encontrado");
            }*/

            $tile = $sth->fetch();

            if (!$tile) {
                throw new \Exception("Lote não encontrado");
            }

            $returnValue = [floatval($tile['x']), floatval($tile['y'])];

            return $response->withJson($this->getDefaultMessage("ok", $returnValue, "Centroid encontrado"));
        } catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function consultaOcorrenciasMapa($request, $response, $args)
    {
        try {
            $sql = "with filtro as (select count(id) contador, sequencia, a.inscricao from mt_coletas a, tbimobiliario tb WHERE ";

            $executeBind = [];

            $where = "tb.inscricao = concat(tb.setor,tb.quadra,tb.lote)";
            if ($request->getParam('insc')) {
                $where .= " AND a.inscricao ILIKE :insc ";

                $executeBind[':insc'] =  '%' . $request->getParam('insc') . '%';
            }
            if ($request->getParam('zona')) {
                $where .= " AND left(a.inscricao,2) = :zona ";

                $executeBind[':zona'] =  $request->getParam('zona');
            }
            if ($request->getParam('agente')) {
                $where .= " AND  usuario_id = :agente ";

                $executeBind[':agente'] =  $request->getParam('agente');
            }
            if ($request->getParam('dataIni')) {
                $where .= " AND date(data_hora)  >= :dataIni ";

                $executeBind[':dataIni'] =  $request->getParam('dataIni');
            }
            if ($request->getParam('dataFim')) {
                $where .= " AND date(data_hora) <= :dataFim ";

                $executeBind[':dataFim'] =  $request->getParam('dataFim');
            }

            $sql .= $where . "
            group by sequencia, a.inscricao ORDER BY sequencia, a.inscricao ), teste as (
                select f.*, l.* from filtro f left join geom_lote l on l.insclote = inscricao) (
                    SELECT row_to_json(t)as coordenada FROM (SELECT 'FeatureCollection' AS type,array_to_json(array_agg(row_to_json(m))) AS features from ( 
                        select 'Feature' AS type, ST_AsGeoJSON(st_transform(geom,3857))::json AS geometry, row_to_json( 
                            row(contador,inscricao,sequencia)) as properties from teste)m)t)
            ";
            $sth = $this->pdo->prepare($sql);

            $sth->execute($executeBind);

            $tile = $sth->fetchALL();

            $data = json_decode($tile[0]['coordenada']);

            return $response->withHeader('Access-Control-Allow-Origin', '*')
                ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
                ->withJson($data);
        } catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function consultaOcorrenciasMapa_API($request, $response, $args)
    {
        try {
                        
            $sql = "with filtro as (select count(id) contador, sequencia, inscricao from mt_coletas a 
            group by sequencia, inscricao ORDER BY sequencia, inscricao  ), teste 
            as ( select f.*, l.* from filtro f left join geom_lote l on l.insclote = inscricao) ( 
                SELECT row_to_json(t)as coordenada FROM (SELECT 'FeatureCollection' AS type,array_to_json(array_agg(row_to_json(m))) AS features from ( 
                    select row_to_json(p) from (select 'Feature' AS type, ST_AsGeoJSON(st_transform(geom,3857))::json AS geometry, row_to_json( 
                        row(contador,inscricao,sequencia)) as properties from teste)p)m)t)
            ";
            $sth = $this->pdo->prepare($sql);
            $sth->execute();

            $tile = $sth->fetchALL();
            $data = json_decode($tile[0]['coordenada']);

            $dados = '';

            if (isset($data->features[0]->geometry)) {
                $dados = $data->features[0];
            } else {
                $dados = $data->features[0]->row_to_json;
            };

            return $response->withHeader('Access-Control-Allow-Origin', '*')
                ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
                ->withJson($dados);
        } catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }
}
