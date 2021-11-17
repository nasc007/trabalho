<?php

namespace App\Controllers;

use App\Controllers\Controller;
use App\Models\Principal;

class SearchController extends Controller
{
    public function logradouro($request, $response)
    {
        try {
            if (!$request->getParam('pesquisa'))
                throw new \Exception("Falha ao encontrar logradouro");

            $principal = new Principal();

            $data = explode(',', $request->getParam('pesquisa'));
            $logradouro = $data[0];
            $numero = null;

            if (count($data) > 1)
                $numero = $data[1];

            return $response->withJson($this->getDefaultMessage("ok", $principal->searchByLogradouro($this->pdo, $logradouro, $numero), ""));
        } catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function responsavel($request, $response)
    {
        try {
            if (!$request->getParam('pesquisa'))
                throw new \Exception("Falha ao encontrar responsável");

            $principal = new Principal();

            return $response->withJson($this->getDefaultMessage("ok", $principal->searchByResponsavel($this->pdo, $request->getParam('pesquisa')), ""));
        } catch (\PDOException | \Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }
}
