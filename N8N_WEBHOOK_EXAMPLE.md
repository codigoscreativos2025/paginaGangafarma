# Ejemplo de Integración con n8n - Remedina (Chat IA)

## Flujo

1. El usuario envía un mensaje desde GangaFarma
2. GangaFarma envía el mensaje a tu webhook de n8n
3. n8n procesa el mensaje con IA y devuelve la respuesta
4. n8n envía la respuesta de vuelta a GangaFarma

---

## 1. Configurar Webhook en GangaFarma (Panel Admin)

En el panel de administración, ve a **Configuración** y configura:
- **Webhook de n8n**: `https://tu-servidor-n8n.com/webhook/chat`
- **IA Activa**: Activado

---

## 2. Webhook que Recibe Mensajes (n8n)

Configura un Webhook en n8n con la URL que configures en el panel de admin.

### Ejemplo de Payload que Recibe n8n:

```json
{
  "message": "Hola, necesito información sobre medicamentos para la gripe",
  "conversationId": "abc123def456",
  "userId": "user789",
  "history": [
    {
      "role": "user",
      "content": "Hola",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "role": "assistant", 
      "content": "¡Hola! Soy Remedina, tu asistente virtual. ¿En qué puedo ayudarte?",
      "timestamp": "2024-01-15T10:30:05Z"
    }
  ]
}
```

### Curl para probar el webhook entrante:

```bash
curl -X POST "https://tu-servidor-n8n.com/webhook/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, necesito información sobre medicamentos para la gripe",
    "conversationId": "abc123def456",
    "userId": "user789",
    "history": []
  }'
```

---

## 3. HTTP Request para Enviar Respuesta

Después de que n8n procese el mensaje con IA, usa un nodo **HTTP Request** para enviar la respuesta de vuelta a GangaFarma.

### Configuración del HTTP Request:

- **Method**: POST
- **URL**: `https://gangafarma.com/api/chat/response`
- **Body Content Type**: JSON
- **Body**:

```json
{
  "conversationId": "{{ $json.conversationId }}",
  "message": "{{ $json.responseFromAI }}"
}
```

### Curl para probar el envío de respuesta:

```bash
curl -X POST "https://gangafarma.com/api/chat/response" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "abc123def456",
    "message": "Para la gripe te recomiendo medicamentos con paracetamol o ibuprofeno. ¿Tienes algún síntoma específico?"
  }'
```

---

## 4. Ejemplo de Flujo en n8n

```
[Webhook] --> [OpenAI/GPT] --> [HTTP Request] --> [Response]
```

### Nodo OpenAI (Ejemplo):
- **Model**: gpt-4
- **Message**: 
```
Eres Remedina, una asistente virtual amigable de farmacia GangaFarma. 
Ayudas a los clientes con información sobre medicamentos, precios y disponibilidad.
Historial de la conversación:
{{ $json.history }}

Nuevo mensaje del cliente: {{ $json.message }}

Responde de manera útil y amigable.
```

---

## 5. Notas Importantes

1. **Timeout**: Configura un timeout adecuado en n8n (recomendado 30 segundos)
2. **Errores**: Maneja errores en n8n y devuelve un mensaje por defecto si la IA falla
3. **Seguridad**: Considera agregar autenticación si es necesario
4. **Testing**: Usa ngrok para probar en desarrollo antes de poner en producción

---

## 6. Variables de Entorno en n8n

Si necesitas configurar el entorno:

```bash
# URL base de GangaFarma
GANGAFARMA_URL=https://gangafarma.com

# Tu webhook (el que configuraste en el panel de admin)
WEBHOOK_URL=https://tu-servidor-n8n.com/webhook/chat
```
