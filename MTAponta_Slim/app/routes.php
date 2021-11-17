<?php
// Routes

use App\Middleware\AuthMiddleware;
use App\Middleware\GuestMiddleware;
use App\Middleware\AuthApiMiddleware;
use App\Middleware\LogMiddleware;

$app->group('', function () {
	$this->get('/auth/signin', 'AuthController:getSignIn')->setName('auth.signin');
	$this->post('/auth/signin', 'AuthController:postSignIn');
})->add(new GuestMiddleware($container));

//------ Rotas acessadas pelo js do MTAponta
$app->post('/lote', 'GeoJsonController:lote')->add(new LogMiddleware($container));
$app->get('/centro', 'GeoJsonController:centro')->add(new LogMiddleware($container));
$app->get('/mapa', 'GeoJsonController:consultaOcorrenciasMapa_API')->add(new LogMiddleware($container));

$app->get('/logradouro', 'LogradouroController:logradouro_mvt');
$app->get('/zona', 'ZonaController:mvt');
//------

$app->group('', function () {
	$this->get('/', 'HomeController:index')->setName('home');
	$this->post('/uploading', 'ShapeController:uploading');
	$this->get('/ocorrenciaagente', 'OcorrenciaController:ocorrenciaAgente');

	$this->group('/search', function () {
		$this->post('/logradouro', 'SearchController:logradouro');
		$this->post('/responsavel', 'SearchController:responsavel');
	});

	$this->group('/lote', function () {
		$this->get('', 'GeoJsonController:lote');
		$this->post('/centroid', 'GeoJsonController:getLoteCentroid');
	});

	$this->group('/zona', function () {
		$this->get('/all', 'ZonaController:all');
	});

	$this->group('/ocorrencia', function () {
		$this->get('', 'OcorrenciaController:get_ocorrencia');
		$this->post('/search', 'OcorrenciaController:search');
		$this->post('/mapa', 'GeoJsonController:consultaOcorrenciasMapa');
		$this->get('/download/{filename}', 'OcorrenciaController:downloadPhotos');
		$this->get('/{inscricao}', 'OcorrenciaController:getByInscricao');
		$this->get('/{inscricao}/{cod_ocorrencia}', 'OcorrenciaController:get_ocorrencia_tipo');
		$this->post('/{id}', 'OcorrenciaController:update');
	});

	$this->group('/ocorrenciasus', function () {
		$this->get('/categorias', 'OcorrenciaSusController:buscarCategoria');
		$this->get('/{inscricao}/{id_usuario}', 'OcorrenciaSusController:getByInscricao');
		$this->post('/search', 'OcorrenciaSusController:search');
		$this->post('/searchResumo', 'OcorrenciaSusController:searchResumo');
	});

	$this->group('/resumolab', function () {
		$this->post('/create', 'ResumoLabController:add');
		$this->post('/search', 'ResumoLabController:searchResumoLab');
		$this->get('/agentes', 'ResumoLabController:agentesResumoLab');
		$this->get('/municipio', 'ResumoLabController:municipioResumoLab');
		$this->get('/uf', 'ResumoLabController:ufResumoLab');
		$this->get('/localidade', 'ResumoLabController:localidadeResumoLab');
	});

	$this->group('/user', function () {
		$this->get('/', 'UserController:index')->setName('user.index');
		$this->get('/add', 'UserController:add')->setName('user.add');
		$this->post('/add', 'UserController:insert');
		$this->get('/edit/{id}', 'UserController:edit')->setName('user.edit');
		$this->get('/all', 'UserController:all');
		$this->get('/all/app', 'UserController:allApp');
		$this->post('/status/{id}', 'UserController:alteraStatus');
		$this->post('/edit/{id}', 'UserController:update');
		$this->get('/userpage/{id}', 'UserController:userpage');
	});

	$this->group('/auth', function () {
		$this->get('/signout', 'AuthController:getSignOut')->setName('auth.signout');
	});

	$this->group('/tipo_ocorrencia', function () {
		$this->get('', 'OcorrenciaTipoController:all');
		$this->post('/add', 'OcorrenciaTipoController:insert');
		$this->post('/edit/{id}', 'OcorrenciaTipoController:update');
		$this->delete('/{id}', 'OcorrenciaTipoController:delete');
		$this->post('/{id}', 'OcorrenciaTipoController:get');
	});

	$this->group('/backup', function () {
		$this->get('/create', 'BackupController:create');
		$this->get('/all', 'BackupController:all');
		$this->get('/download', 'BackupController:download');
	});

	$this->group('/layer', function () {
		$this->post('', 'LayersController:add');
		$this->get('/all', 'LayersController:index');
		$this->post('/update/{id}', 'LayersController:update');
		$this->get('/delete/{id}', 'LayersController:delete');
	});

	$this->group('/grafico', function () {
		$this->post('/{agregador}', 'GraficoController:getOcorrencias');
	});
})->add(new AuthMiddleware($container))->add(new LogMiddleware($container));

//------ Rotas usadas pelo MTAponta
$app->group('/api', function () {
	$this->group('/user', function () {
		$this->post('/create', 'UsuarioApiController:create')->add(new LogMiddleware($this->getContainer()));
		$this->post('/login', 'UsuarioApiController:login')->add(new LogMiddleware($this->getContainer()));
		$this->post('/pass', 'UsuarioApiController:pass')->add(new AuthApiMiddleware($this->getContainer()))->add(new LogMiddleware($this->getContainer()));
		$this->post('/location', 'UsuarioApiController:location')->add(new AuthApiMiddleware($this->getContainer()))->add(new LogMiddleware($this->getContainer()));
	});
	$this->group('/ocorrencia', function () {
		$this->post('/create', 'OcorrenciaController:create');
		$this->get('/tipo', 'OcorrenciaTipoController:all');
		$this->get('/tipo/{inscricao}', 'OcorrenciaController:ocorrenciaTipo');
		$this->get('/download/{filename}', 'OcorrenciaController:downloadPhotos');
		$this->post('/pesquisa', 'PesquisaController:pesquisa');
		$this->post('/update/{id}', 'OcorrenciaController:update');
		$this->get('/{inscricao}', 'OcorrenciaController:get_ocorrencia_api');
		$this->get('/{inscricao}/{cod_ocorrencia}', 'OcorrenciaController:get_ocorrencia_tipo');
	})->add(new AuthApiMiddleware($this->getContainer()))->add(new LogMiddleware($this->getContainer()));

	$this->group('/ocorrenciasus', function () {
		$this->post('/{inscricao}', 'OcorrenciaSusController:get_ocorrenciaSus_api');
		$this->get('/principalSus/{inscricao}', 'OcorrenciaSusController:get_principalSus_api');
		$this->get('/mapa', 'GeoJsonController:consultaOcorrenciasMapa_API');
	})->add(new AuthApiMiddleware($this->getContainer()))->add(new LogMiddleware($this->getContainer()));

	$this->group('/coleta', function () {
		$this->post('/coleta/{sequencia}', 'OcorrenciaApiColetaController:coleta');
		$this->post('/tela/{sequencia}', 'PrincipalSUSApiController:telas');
		$this->post('/foto/{sequencia}', 'FotosApiController:foto');
	})->add(new AuthApiMiddleware($this->getContainer()))->add(new LogMiddleware($this->getContainer()));
});
//------
