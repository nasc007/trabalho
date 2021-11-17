<?php

namespace App\Controllers;

use App\Controllers\Controller;
use App\Models\UserRole;
use App\Models\ResumoLab;

class ResumoLabController extends Controller
{
    public function add ($request, $response)
    {
        try {
            if ($this->auth->user()->type != UserRole::Admin && $this->auth->user()->type != UserRole::AdminAppUser)
                throw new \Exception("error: ", 'Usuário não tem permissão');
            
            
            $resumo = '';//ResumoLab::where('n_controle', '=', $request->getParam('n_controle'))->first();

            if (!$resumo) {
                $resumo = new ResumoLab();

                $resumo->fill([
                    'n_controle' => $request->getParam('n_controle'),   'uf' => $request->getParam('uf'),
                    'municipio' => $request->getParam('municipio'),     'ano' => $request->getParam('ano'),
                    'zona' => $request->getParam('zona'),               'ciclo_ano' => $request->getParam('ciclo_ano'),
                    'localidade' => $request->getParam('localidade'),   'categoria' => $request->getParam('categoria'),
                    'atividade' => $request->getParam('atividade'),     'microarea' => $request->getParam('microarea'),
                    'semana_ep' => $request->getParam('semana_ep'),     'agente' => $request->getParam('agente'),

                    'a1_aegypti' => $request->getParam('a1_aegypti'),   'a2_aegypti' => $request->getParam('a2_aegypti'),
                    'b_aegypti' => $request->getParam('b_aegypti'),     'c1_aegypti' => $request->getParam('c1_aegypti'),
                    'd1_aegypti' => $request->getParam('d1_aegypti'),   'd2_aegypti' => $request->getParam('d2_aegypti'),
                    'e_aegypti' => $request->getParam('e_aegypti'),     'total_aegypti' => $request->getParam('total_aegypti'),

                    'a1_albopictus' => $request->getParam('a1_albopictus'),   'a2_albopictus' => $request->getParam('a2_albopictus'),
                    'b_albopictus' => $request->getParam('b_albopictus'),     'c1_albopictus' => $request->getParam('c1_albopictus'),
                    'd1_albopictus' => $request->getParam('d1_albopictus'),   'd2_albopictus' => $request->getParam('d2_albopictus'),
                    'e_albopictus' => $request->getParam('e_albopictus'),     'total_albopictus' => $request->getParam('total_albopictus'),

                    'r_aegypti' => $request->getParam('r_aegypti'),         'c2_aegypti' => $request->getParam('c2_aegypti'),
                    'tb_aegypti' => $request->getParam('tb_aegypti'),       'pe_aegypti' => $request->getParam('pe_aegypti'),
                    'o_aegypti' => $request->getParam('o_aegypti'),         'total_imoveis_aegypti' => $request->getParam('total_imoveis_aegypti'),

                    'r_albopictus' => $request->getParam('r_albopictus'),   'c2_albopictus' => $request->getParam('c2_albopictus'),
                    'tb_albopictus' => $request->getParam('tb_albopictus'), 'pe_albopictus' => $request->getParam('pe_albopictus'),
                    'o_albopictus' => $request->getParam('o_albopictus'),   'total_imoveis_albopictus' => $request->getParam('total_imoveis_albopictus'),

                    'r_outros' => $request->getParam('r_outros'),       'c_outros' => $request->getParam('c_outros'),
                    'tb_outros' => $request->getParam('tb_outros'),     'pe_outros' => $request->getParam('pe_outros'),
                    'o_outros' => $request->getParam('o_outros'),       'total_outros' => $request->getParam('total_outros'),

                    'larvas_aegypti' => $request->getParam('larvas_aegypti'),       'pupas_aegypti' => $request->getParam('pupas_aegypti'),
                    'expupa_aegypti' => $request->getParam('expupa_aegypti'),       'adultos_aegypti' => $request->getParam('adultos_aegypti'),
                    'larvas_albopictus' => $request->getParam('larvas_albopictus'), 'pupas_albopictus' => $request->getParam('pupas_albopictus'),
                    'expupa_albopictus' => $request->getParam('expupa_albopictus'), 'adultos_albopictus' => $request->getParam('adultos_albopictus'),
                    'larvas_outros' => $request->getParam('larvas_outros'),         'pupas_outros' => $request->getParam('pupas_outros'),
                    'expupa_outros' => $request->getParam('expupa_outros'),         'adultos_outros' => $request->getParam('adultos_outros'),

                    'quart_aegypti_1' => $request->getParam('quart_aegypti_1'),     'quart_aegypti_2' => $request->getParam('quart_aegypti_2'),
                    'quart_aegypti_3' => $request->getParam('quart_aegypti_3'),     'quart_aegypti_4' => $request->getParam('quart_aegypti_4'),
                    'quart_aegypti_5' => $request->getParam('quart_aegypti_5'),     'quart_aegypti_6' => $request->getParam('quart_aegypti_6'),
                    'quart_aegypti_7' => $request->getParam('quart_aegypti_7'),     'quart_aegypti_8' => $request->getParam('quart_aegypti_8'),
                    'quart_aegypti_9' => $request->getParam('quart_aegypti_9'),     'quart_aegypti_10' => $request->getParam('quart_aegypti_10'),
                    'quart_aegypti_11' => $request->getParam('quart_aegypti_11'),   'quart_aegypti_12' => $request->getParam('quart_aegypti_12'),
                    'quart_aegypti_13' => $request->getParam('quart_aegypti_13'),   'quart_aegypti_14' => $request->getParam('quart_aegypti_14'),
                    'quart_aegypti_15' => $request->getParam('quart_aegypti_15'),   'quart_aegypti_16' => $request->getParam('quart_aegypti_16'),
                    'quart_aegypti_17' => $request->getParam('quart_aegypti_17'),   'quart_aegypti_18' => $request->getParam('quart_aegypti_18'),
                    'quart_aegypti_19' => $request->getParam('quart_aegypti_19'),   'quart_aegypti_20' => $request->getParam('quart_aegypti_20'),
                    'quart_aegypti_21' => $request->getParam('quart_aegypti_21'),   'quart_aegypti_22' => $request->getParam('quart_aegypti_22'),
                    'quart_aegypti_23' => $request->getParam('quart_aegypti_23'),   'quart_aegypti_24' => $request->getParam('quart_aegypti_24'),
                    'quart_aegypti_25' => $request->getParam('quart_aegypti_25'),   'quart_aegypti_26' => $request->getParam('quart_aegypti_26'),
                    'quart_aegypti_27' => $request->getParam('quart_aegypti_27'),   'quart_aegypti_28' => $request->getParam('quart_aegypti_28'),

                    'quart_albopictus_1' => $request->getParam('quart_aegypti_1'),      'quart_albopictus_2' => $request->getParam('quart_albopictus_2'),
                    'quart_albopictus_3' => $request->getParam('quart_albopictus_3'),   'quart_albopictus_4' => $request->getParam('quart_albopictus_4'),
                    'quart_albopictus_5' => $request->getParam('quart_albopictus_5'),   'quart_albopictus_6' => $request->getParam('quart_albopictus_6'),
                    'quart_albopictus_7' => $request->getParam('quart_albopictus_7'),   'quart_albopictus_8' => $request->getParam('quart_albopictus_8'),
                    'quart_albopictus_9' => $request->getParam('quart_albopictus_9'),   'quart_albopictus_10' => $request->getParam('quart_albopictus_10'),
                    'quart_albopictus_11' => $request->getParam('quart_albopictus_11'), 'quart_albopictus_12' => $request->getParam('quart_albopictus_12'),
                    'quart_albopictus_13' => $request->getParam('quart_albopictus_13'), 'quart_albopictus_14' => $request->getParam('quart_albopictus_14'),
                    'quart_albopictus_15' => $request->getParam('quart_albopictus_15'), 'quart_albopictus_16' => $request->getParam('quart_albopictus_16'),
                    'quart_albopictus_17' => $request->getParam('quart_albopictus_17'), 'quart_albopictus_18' => $request->getParam('quart_albopictus_18'),
                    'quart_albopictus_19' => $request->getParam('quart_albopictus_19'), 'quart_albopictus_20' => $request->getParam('quart_albopictus_20'),
                    'quart_albopictus_21' => $request->getParam('quart_albopictus_21'), 'quart_albopictus_22' => $request->getParam('quart_albopictus_22'),
                    'quart_albopictus_23' => $request->getParam('quart_albopictus_23'), 'quart_albopictus_24' => $request->getParam('quart_albopictus_24'),
                    'quart_albopictus_25' => $request->getParam('quart_albopictus_25'), 'quart_albopictus_26' => $request->getParam('quart_albopictus_26'),
                    'quart_albopictus_27' => $request->getParam('quart_albopictus_27'), 'quart_albopictus_28' => $request->getParam('quart_albopictus_28'),

                    'quart_aegy_alb_1' => $request->getParam('quart_aegy_alb_1'),   'quart_aegy_alb_2' => $request->getParam('quart_aegy_alb_2'),
                    'quart_aegy_alb_3' => $request->getParam('quart_aegy_alb_3'),   'quart_aegy_alb_4' => $request->getParam('quart_aegy_alb_4'),                    
                    'quart_aegy_alb_5' => $request->getParam('quart_aegy_alb_5'),   'quart_aegy_alb_6' => $request->getParam('quart_aegy_alb_6'),
                    'quart_aegy_alb_7' => $request->getParam('quart_aegy_alb_7'),   'quart_aegy_alb_8' => $request->getParam('quart_aegy_alb_8'),
                    'quart_aegy_alb_9' => $request->getParam('quart_aegy_alb_9'),   'quart_aegy_alb_10' => $request->getParam('quart_aegy_alb_10'),
                    'quart_aegy_alb_11' => $request->getParam('quart_aegy_alb_11'), 'quart_aegy_alb_12' => $request->getParam('quart_aegy_alb_12'),
                    'quart_aegy_alb_13' => $request->getParam('quart_aegy_alb_13'), 'quart_aegy_alb_14' => $request->getParam('quart_aegy_alb_14'),
                    'quart_aegy_alb_15' => $request->getParam('quart_aegy_alb_15'), 'quart_aegy_alb_16' => $request->getParam('quart_aegy_alb_16'),
                    'quart_aegy_alb_17' => $request->getParam('quart_aegy_alb_17'), 'quart_aegy_alb_18' => $request->getParam('quart_aegy_alb_18'),
                    'quart_aegy_alb_19' => $request->getParam('quart_aegy_alb_19'), 'quart_aegy_alb_20' => $request->getParam('quart_aegy_alb_20'),
                    'quart_aegy_alb_21' => $request->getParam('quart_aegy_alb_21'), 'quart_aegy_alb_22' => $request->getParam('quart_aegy_alb_22'),
                    'quart_aegy_alb_23' => $request->getParam('quart_aegy_alb_23'), 'quart_aegy_alb_24' => $request->getParam('quart_aegy_alb_24'),
                    'quart_aegy_alb_25' => $request->getParam('quart_aegy_alb_25'), 'quart_aegy_alb_26' => $request->getParam('quart_aegy_alb_26'),
                    'quart_aegy_alb_27' => $request->getParam('quart_aegy_alb_27'), 'quart_aegy_alb_28' => $request->getParam('quart_aegy_alb_28'),
                ]);

                $resumo->save();

                return $response->withHeader('Access-Control-Allow-Origin', '*')
                ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
                ->withJson($this->getDefaultMessage("ok", $resumo, "Incluído com sucesso."));
            }
        } catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }
    
    public function searchResumoLab($request, $response, $args)
    {
        try {
            $resumo = null;

            if ($request->getParam('agente')) {
                $resumo = ResumoLab::where('agente', '=', $request->getParam('agente'));
            }

            if ($request->getParam('municipio')) {
                if(!$resumo)
                    $resumo = ResumoLab::whereRaw('municipio = ?', [$request->getParam('municipio')]);
                else
                    $resumo->whereRaw('municipio = ?', [$request->getParam('municipio')]);
            }

            if ($request->getParam('uf')) {
                if(!$resumo)
                    $resumo = ResumoLab::whereRaw('uf = ?', [$request->getParam('uf')]);
                else
                    $resumo->whereRaw('uf = ?', [$request->getParam('uf')]);
            }

            if ($request->getParam('localidade')) {
                if(!$resumo)
                    $resumo = ResumoLab::whereRaw('localidade = ?', [$request->getParam('localidade')]);
                else
                    $resumo->whereRaw('localidade = ?', [$request->getParam('localidade')]);
            }

            $resumo = $resumo->get();

            $array = $resumo->toArray();

            //$print = json_encode($array);
            //print_r($print);die;

            return $response->withJson($this->getDefaultMessage("ok", $array, ""));
        }catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function agentesResumoLab($request, $response, $args)
    {
        try {
            $agentes = ResumoLab::DISTINCT('agente')->get();

            return $response->withJson($this->getDefaultMessage("ok", $agentes, ""));
        }catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function municipioResumoLab($request, $response, $args)
    {
        try {
            $municipio = ResumoLab::DISTINCT('municipio')->get();

            return $response->withJson($this->getDefaultMessage("ok", $municipio, ""));
        }catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function ufResumoLab($request, $response, $args)
    {
        try {
            $uf = ResumoLab::DISTINCT('uf')->get();

            return $response->withJson($this->getDefaultMessage("ok", $uf, ""));
        }catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function localidadeResumoLab($request, $response, $args)
    {
        try {
            $localidade = ResumoLab::DISTINCT('localidade')->get();

            return $response->withJson($this->getDefaultMessage("ok", $localidade, ""));
        }catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }
}
