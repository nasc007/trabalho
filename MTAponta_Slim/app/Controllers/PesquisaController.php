<?php

namespace App\Controllers;

use App\Controllers\Controller;

class PesquisaController extends Controller
{
    public function pesquisa($request, $response, $args)
    {
        try{
            $tile = '';

            
            $sql = "with outra as (SELECT ST_CENTROID(geom) as shape, concat(tb.setor,tb.quadra,tb.lote) as inscricao, tb.proprietario as responsavel, 
            l.descricao as logradouros, tb.numpredial as nimovel
            from geom_lote left join tbimobiliario tb on insclote = concat(tb.setor,tb.quadra,tb.lote) left join logradouros l on l.codigo = tb.codlogradouro";
            if($request->getParam('insc') || $request->getParam('lograd') || $request->getParam('prop'))
                $sql .= " WHERE ";
            
            $where = '';
            $order = '';
            if($request->getParam('insc'))
            {
                $where .= " i.inscricao ILIKE '%".$request->getParam('insc')."%' ";
                
                if($order)
                    $order.=',';
                $order.= "i.inscricao";
            }

            if($request->getParam('lograd'))
            {
                if($where != '')
                {
                    $where.= " OR ";
                }
                $where.= "unaccent(l.descricao) ILIKE unaccent('%".$request->getParam('lograd')."%') ";
                
                if($order)
                    $order.=',';
                $order.= "l.descricao";

                if($request->getParam('num'))
                {
                    $where.=" AND tb.numpredial = " . $request->getParam('num');
                }
                
                if($order)
                    $order.=',';
                $order.= "tb.numpredial";
            }

            if($request->getParam('prop'))
            {
                if($where != '')
                {
                    $where.= " AND ";
                }
                $where.="unaccent(i.responsavel) ILIKE unaccent('%".$request->getParam('prop')."%')";
                if($order)
                    $order.=',';
                $order.= "l.descricao";
            }

            if($order){
                $order = 'order by '.$order;
            }

            $sql .= $where.' '.$order." limit 1000) SELECT row_to_json(t)as coordenada FROM (
            SELECT 'FeatureCollection' AS type,array_to_json(array_agg(row_to_json(m))) AS features 
            FROM (select row_to_json(p) FROM ( select 'Feature' AS type, ST_AsGeoJSON(st_transform(shape,3857))::json 
            AS geometry, ST_AsGeoJSON(st_transform(shape,4326))::json AS centroid, row_to_json(
            row(inscricao, responsavel, logradouros, nimovel)) as properties FROM outra)p)m)t
            ";
            $sth = $this->pdo->prepare($sql);
            //var_dump($sth);die;
            $sth->execute();
            
            //$sth->debugDumpParams();die;
            $tile = $sth->fetchALL();
            return $response->withJson($this->getDefaultMessage("ok", json_decode($tile[0]['coordenada']), ""));
        }catch(\PDOException | \Exception $e){
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));

        }
    }
}
        