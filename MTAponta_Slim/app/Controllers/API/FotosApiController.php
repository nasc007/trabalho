<?php

namespace App\Controllers\API;


use App\Controllers\ApiController;
use Slim\Http\UploadedFile;

use App\Models\Fotos;

class FotosApiController extends ApiController
{
    public function foto($request, $response, $args)
    {
        try {

            $nomLogin = $_SESSION['token_authenticated_user']->login;
            if (!$nomLogin)
                throw new \Exception("Sem usuário logado ou token inválido");


            $foto = Fotos::where('sequencia', '=', $args['sequencia'])->first();

            if (!$foto) {

                $foto = Fotos::create([
                    'sequencia' => $request->getParam('sequencia'),
                    'indicefoto' => $request->getParam('indicefoto'),
                    'dataatu' => date('Y-m-d', strtotime($request->getParam('dataatu'))),
                    'horaatu' => $request->getParam('horaatu'),
                    'status' => $request->getParam('status'),
                    'posx' => $request->getParam('posx'),
                    'posy' => $request->getParam('posy'),
                ]);

                $directory = $this->settings['upload_path'];
                $uploadedFiles = $request->getUploadedFiles();

                foreach ($uploadedFiles['file'] as $uploadedFile) {
                    if ($uploadedFile) {
                        $this->moveUploadedFile($directory, $uploadedFile, $foto->id) . "\r\n";
                    } else {
                        throw new \Exception("CURL error:" . $uploadedFile->getError());
                    }
                }

                return $response->withJson($this->getDefaultMessage("ok", $foto, "Incluído com sucesso."));
            } else {
                $foto->fill([
                    'sequencia' => $request->getParam('sequencia') != null ? $request->getParam('sequencia') : $foto->sequencia,
                    'indicefoto' => $request->getParam('indicefoto') != null ? $request->getParam('indicefoto') : $foto->indicefoto,
                    'dataatu' => $request->getParam('dataatu') != null ? date('Y-m-d', strtotime($request->getParam('dataatu'))) : $foto->dataatu,
                    'horaatu' => $request->getParam('horaatu') != null ? $request->getParam('horaatu') : $foto->horaatu,
                    'status' => $request->getParam('status') != null ? $request->getParam('status') : $foto->status,
                    'posx' => $request->getParam('posx') != null ? $request->getParam('posx') : $foto->posx,
                    'posy' => $request->getParam('posy') != null ? $request->getParam('posy') : $foto->posy,
                ]);

                $foto->save();

                $directory = $this->settings['upload_path'];
                $uploadedFiles = $request->getUploadedFiles();

                foreach ($uploadedFiles['file'] as $uploadedFile) {
                    if ($uploadedFile) {
                        $this->moveUploadedFile($directory, $uploadedFile) . "\r\n";
                    } else {
                        throw new \Exception("CURL error:" . $uploadedFile->getError());
                    }
                }

                return $response->withJson($this->getDefaultMessage("ok", $foto, "Alterado com sucesso."));
            };
        } catch (\Exception $e) {
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function moveUploadedFile($directory, $uploadedFile)
    {
        try {
            //$pos = strpos($uploadedFile->getClientFilename(), '_', strpos($uploadedFile->getClientFilename(), '_') + 1);
            $teste = $uploadedFile->getClientFilename('name'); //substr_replace($uploadedFile->getClientFilename(), $foto_id, $pos + 1, 0);

            $uploadedFile->moveTo($directory . DIRECTORY_SEPARATOR . $teste);

            return $directory . DIRECTORY_SEPARATOR . $uploadedFile->getClientFilename('name');
        } catch (\PDOException | \Exception $e) {
            return $uploadedFile->getClientFilename('name');
        }
    }
}
