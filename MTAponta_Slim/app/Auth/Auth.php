<?php

namespace App\Auth;

use App\Models\User;

class Auth
{
	public function user()
	{
		if (isset($_SESSION['user']))
			return User::find($_SESSION['user']);

		return false;
	}

	public function check()
	{
		return isset($_SESSION['user']);
	}

	public function attempt($email, $password)
	{

		$user = User::where('email', $email)->first();

		if (!$user) {
			return false;
		}

		if (!password_verify($password, $user->password)) {
			return false;
		}

		if (!$user->ativo)
			return false;

		if (!$user->canLogin())
			return false;

		$_SESSION['user'] = $user->id;

		return true;
	}

	public function attemptByLogin($login, $password)
	{

		$user = User::where('login', $login)->first();

		if (!$user) {
			return false;
		}

		if (!password_verify($password, $user->password)) {
			return false;
		}

		if (!$user->ativo)
			return false;

		if (!$user->canLogin(false))
			return false;

		$_SESSION['user'] = $user->id;

		return true;
	}

	public function logout()
	{
		unset($_SESSION['user']);
	}
}
