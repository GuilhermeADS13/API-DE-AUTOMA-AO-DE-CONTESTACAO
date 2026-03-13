import React from "react";
import { Button, Form, Modal } from "react-bootstrap";

export default function AuthModal({
  show,
  mode,
  form,
  errors,
  feedback,
  onHide,
  onModeChange,
  onFieldChange,
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
              placeholder="voce@escritorio.com"
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
              placeholder="Minimo de 6 caracteres"
              isInvalid={Boolean(errors.password)}
            />
            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
          </Form.Group>

          <Button type="submit" variant="dark" className="w-100 auth-submit-btn">
            {isSignup ? "Criar conta e entrar" : "Entrar com e-mail"}
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
