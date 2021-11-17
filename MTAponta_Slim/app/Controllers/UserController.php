<?php

namespace App\Controllers;

use App\Controllers\Controller;
use App\Models\User;
use App\Models\UserRole;
use Respect\Validation\EmailAvailable;
use Respect\Validation\Validator as v;
use \Firebase\JWT\JWT;
use \Firebase\JWT\ExpiredException;

class UserController extends Controller
{
	public function insert($request, $response)
	{
		if ($this->auth->user()->type != UserRole::Admin && $this->auth->user()->type != UserRole::AdminAppUser)
			return $response->withJson($this->getDefaultMessage("error", null, 'Usuário não tem permissão'));

		$validation = $this->validator->validate($request, [
			'email' => v::noWhitespace()->notEmpty()->emailAvailable(),
			'name' => v::notEmpty()->alpha(),
			'type' => v::notEmpty(),
			'login' => v::noWhitespace()->notEmpty(),
			'password' => v::noWhitespace()->notEmpty()
		]);

		if ($validation->failed()) {
			return $response->withJson($this->getDefaultMessage("error", null, 'Problemas com campos da alteração.\n' . $this->validator->toJson()));
		}

		$user = User::create([
			'email' => $request->getParam('email'),
			'name' => $request->getParam('name'),
			'type' => $request->getParam('type'),
			'login' => $request->getParam('login'),
			'color' => $request->getParam('color'),
			'password' => password_hash($request->getParam('password'), PASSWORD_DEFAULT),
		]);

		return $response->withJson($this->getDefaultMessage("ok", $user, ""));
	}

	public function update($request, $response, $args)
	{
		if ($this->auth->user()->type != UserRole::Admin && $this->auth->user()->type != UserRole::AdminAppUser)
			return $response->withJson($this->getDefaultMessage("error", null, 'Usuário não tem permissão'));

		$user = User::find($args['id']);
		if (!isset($user)) {
			return $response->withJson($this->getDefaultMessage("error", null, 'Problemas com a alteração.'));
		}

		$validation = $this->validator->validate($request, [
			'email' => v::noWhitespace()->notEmpty(),
			'name' => v::notEmpty()->alpha(),
			'type' => v::notEmpty(),
			'login' => v::noWhitespace()->notEmpty()
		]);

		if ($validation->failed()) {
			return $response->withJson($this->getDefaultMessage("error", null, 'Problemas com campos da alteração.\n' . $this->validator->toJson()));
		}

		$user->email = $request->getParam('email');
		$user->name = $request->getParam('name');
		$user->type =  $request->getParam('type');
		$user->color = $request->getParam('color');
		$user->login =  $request->getParam('login');

		if (!empty($request->getParam('password')))
			$user->password = password_hash($request->getParam('password'), PASSWORD_DEFAULT);

		$user->save();

		return $response->withJson($this->getDefaultMessage("ok", $user, ""));
	}

	public function all($request, $response, $args)
	{
		try {
			$user = User::orderBy('id')->get();
			return $response->withJson($this->getDefaultMessage("ok", $user, ""));
		} catch (\PDOException | \Exception $e) {
			return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
		}
	}

	public function allApp($request, $response, $args)
	{
		try {
			$user = User::canUseApp()->orderBy('name')->get();
			return $response->withJson($this->getDefaultMessage("ok", $user, ""));
		} catch (\PDOException | \Exception $e) {
			return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
		}
	}

	public function alteraStatus($request, $response, $args)
	{
		try {
			if ($this->auth->user()->type != UserRole::Admin && $this->auth->user()->type != UserRole::AdminAppUser)
				return $response->withJson($this->getDefaultMessage("error", null, 'Usuário não tem permissão'));

			$id = $args['id'];

			$user = User::find($id);

			$user->ativo = !$user->ativo;

			$user->save();
			return $response->withJson($this->getDefaultMessage("ok", $user, " Atualizado com sucesso!"));
		} catch (\PDOException | \Exception $e) {
			return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
		}
	}

	public function userpage($request, $response, $args)
	{
		try {
			$user = User::where('id', '=', $args['id'])->get();
			return $response->withJson($this->getDefaultMessage("ok", $user, ""));
		} catch (\PDOException | \Exception $e) {
			return $response->withJson($this->getDefaultMessage("error", null, $e->getMessage()));
		}
	}
}
