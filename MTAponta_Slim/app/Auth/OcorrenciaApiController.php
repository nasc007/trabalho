<?php
namespace App\Controllers\API;

use App\Controllers\ApiController;

use App\Models\Ocorrencia;
use App\Models\User;

class OcorrenciaApiController extends ApiController
{	
    public function create($request, $response, $args)
    {
        try {

		    $nomLogin = $_SESSION['token_authenticated_user']->login;
		    if(!$nomLogin)
                throw new \Exception("Sem usuário logado ou token inválido");
            
                ;

            $ocorrencia = Ocorrencia::create(array(
                'ocorrencia_tipo_id' => $request->getParam('cod_tipo_ocorrencia'),
                'usuario_id' => $_SESSION['token_authenticated_user']->id,
                'inscricao' => $request->getParam('inscricao'),
                'posicao_x' => $request->getParam('vlr_pos_x'),
                'posicao_y' => $request->getParam('vlr_pos_y'),
                'data_hora' => $request->getParam('data_hora'),
                'atendente' => $request->getParam('nom_atendente'),
                'atendente_tipo' => $request->getParam('tip_atendente'),
                'observacao' => $request->getParam('dsc_observacao'),
            ));
        
            $directory = $this->settings['upload_path'];
            $uploadedFiles = $request->getUploadedFiles();
            
            foreach ($uploadedFiles['file'] as $uploadedFile) {
                if ($uploadedFile->getError() === UPLOAD_ERR_OK) {
                    $this->moveUploadedFile($directory, $uploadedFile, $ocorrencia->cod_ocorrencia)."\r\n";
                }else {
                    throw new \Exception("CURL error:". $err);
                }
            }
            
			if($this->settings['security']['api_login_type'] == 'giap'){
                $codInfracao = giap::geraInfracao( $this->settings['upload_path'], $this->settings['giap']['ws_url'],$ocorrencia->inscricao, $ocorrencia->cod_ocorrencia, $nomLogin);
                if($codInfracao>0)
                {
                    $ocorrencia->status = $codInfracao;
                    $ocorrencia->save();
                }
            }
            
            return $response->withJson($this->getDefaultMessage("ok", $ocorrencia, " Incluído com sucesso."));
        }
        catch( \PDOException $e){
            
            if(count($e->errorInfo) >=2 && ($e->errorInfo[0] == "23505") && ($e->errorInfo[1] == 7)){
                return $response->withJson($this->getDefaultMessage("error", null, "chave duplicada"));
            }            

            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
        catch(\Exception $e){
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }

    public function update($request, $response, $args)
    {
        try {
            $ocorrencia = Ocorrencia::find($args['id']);
            if(!$ocorrencia){
                throw new \Exception("Ocorrência não encontrada");
            }

            $nomLogin = $_SESSION['token_authenticated_user']->login;
		    if(!$nomLogin)
                throw new \Exception("Sem usuário logado ou token inválido");
            
            $ocorrencia->ocorrencia_tipo_id = $request->getParam('cod_tipo_ocorrencia');
            $ocorrencia->usuario_id = $_SESSION['token_authenticated_user']->id;
            $ocorrencia->inscricao = $request->getParam('inscricao');
            $ocorrencia->posicao_x = $request->getParam('vlr_pos_x');
            $ocorrencia->posicao_y = $request->getParam('vlr_pos_y');
            $ocorrencia->data_hora = $request->getParam('data_hora');
            $ocorrencia->atendente = $request->getParam('nom_atendente');
            $ocorrencia->atendente_tipo = $request->getParam('tip_atendente');
            $ocorrencia->observacao = $request->getParam('dsc_observacao');

            $ocorrencia->save();
            
            $directory = $this->settings['upload_path'];
            $uploadedFiles = $request->getUploadedFiles();
        
            foreach ($uploadedFiles['file'] as $uploadedFile) {
                if ($uploadedFile->getError() === UPLOAD_ERR_OK) {
                    $this->moveUploadedFile($directory, $uploadedFile)."\r\n";
                }else {
                    throw new \Exception("CURL error:". $err);
                }
            }
            return $response->withJson($this->getDefaultMessage("ok", null, "Alterado com sucesso."));
        } catch(PDOException | \Exception $e){
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }    
  

    public function moveUploadedFile($directory, $uploadedFile, $ocorrencia_id)
    { 
        try{
            $pos = strpos($uploadedFile->getClientFilename(), '_', strpos($uploadedFile->getClientFilename(), '_') + 1);
            $teste = substr_replace($uploadedFile->getClientFilename(),$ocorrencia_id,$pos+1,0);
            $uploadedFile->moveTo($directory . DIRECTORY_SEPARATOR . $teste);
            
            return $directory . DIRECTORY_SEPARATOR . $uploadedFile->getClientFilename();
        } catch(\PDOException | \Exception $e){
            return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
        }
    }
}