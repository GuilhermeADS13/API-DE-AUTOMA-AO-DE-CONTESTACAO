// Modal de autenticacao para login e cadastro via Supabase Auth.
import React from "react";
import { Button, Form, Modal } from "react-bootstrap";

/**
 * Modal de autenticacao (login/cadastro) com validacao visual em tempo real.
 */
export default function AuthModal({
  show,
  mode,
  form,
  errors,
  feedback,
  loading,
  passwordChecks,
  onHide,
  onModeChange,
  onFieldChange,
  onFieldBlur,
  onSubmit,
}) {
  const isSignup = mode === "signup";

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="auth-modal">
      <Modal.Header closeButton>
        <Modal.Title>{isSignup ? "Crie sua conta" : "Entre na plataforma"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="auth-mode-switch">
          <button
            type="button"
            className={`auth-mode-pill ${!isSignup ? "is-active" : ""}`}
            onClick={() => onModeChange("login")}
          >
            Entrar
          </button>

          <button
            type="button"
            className={`auth-mode-pill ${isSignup ? "is-active" : ""}`}
            onClick={() => onModeChange("signup")}
          >
            Criar conta
          </button>
        </div>

        <div className="auth-intro-copy">
          {isSignup
            ? "Cadastre-se para centralizar os casos, salvar rascunhos e acompanhar a automacao das defesas."
            : "Acesse sua operacao juridica para continuar os fluxos, revisar minutas e exportar as defesas."}
        </div>

        {feedback && (
          <div className={`auth-feedback is-${feedback.variant}`}>
            {feedback.text}
          </div>
        )}

        <Form onSubmit={onSubmit}>
          {isSignup && (
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={onFieldChange}
                onBlur={onFieldBlur}
                placeholder="Seu nome ou o nome do escritorio"
                isInvalid={Boolean(errors.name)}
              />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={form.email}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              placeholder="voce@escritorio.com"
              autoComplete={isSignup ? "email" : "username"}
              isInvalid={Boolean(errors.email)}
            />
            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Senha</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={form.password}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              placeholder={isSignup ? "Crie uma senha forte" : "Digite sua senha"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              isInvalid={Boolean(errors.password)}
            />
            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>

            {isSignup && (
              <div className="d-grid gap-1 mt-2">
                <small className={passwordChecks?.minLength ? "text-success" : "text-secondary"}>
                  Minimo de 8 caracteres
                </small>
                <small className={passwordChecks?.hasUppercase ? "text-success" : "text-secondary"}>
                  Pelo menos 1 letra maiuscula
                </small>
                <small className={passwordChecks?.hasLowercase ? "text-success" : "text-secondary"}>
                  Pelo menos 1 letra minuscula
                </small>
                <small className={passwordChecks?.hasNumber ? "text-success" : "text-secondary"}>
                  Pelo menos 1 numero
                </small>
                <small className={passwordChecks?.hasSymbol ? "text-success" : "text-secondary"}>
                  Pelo menos 1 simbolo
                </small>
              </div>
            )}
          </Form.Group>

          <Button type="submit" variant="dark" className="w-100 auth-submit-btn" disabled={loading}>
            {loading ? "Processando..." : isSignup ? "Criar conta e entrar" : "Entrar com e-mail"}
          </Button>
        </Form>

        <div className="auth-footer-note">
          {isSignup
            ? "Ao criar sua conta, voce libera o acesso ao workspace de automacao de defesas."
            : "Sem conta ainda? Troque para Criar conta e habilite seu acesso em segundos."}
        </div>
      </Modal.Body>
    </Modal>
  );
}
