import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const NotificationModal = ({ show, onClose, data, onAccept, onReject }) => {
  if (!show || !data) return null;

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>New Session Request</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Client:</strong> {data.userName}</p>
        <p><strong>Type:</strong> {data.mode}</p>
        <p><strong>Time:</strong> {new Date(data.timestamp).toLocaleTimeString()}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={onReject}>
          Reject
        </Button>
        <Button variant="success" onClick={onAccept}>
          Accept
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotificationModal;