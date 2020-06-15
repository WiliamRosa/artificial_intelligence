import cv2
import face_recognition
import os
from kafka import KafkaProducer
from json import dumps

from twilio.rest import Client

account_sid = 'seu_account_id'
auth_token = 'seu_token'
client = Client(account_sid, auth_token)

guest_list = [
    {
        "nome": "ludwin",
        "registro": "pendiente",
        "numero": "whatsapp:+5516992685376"
    },
    {
        "nome": "elon",
        "registro": "pendiente",
        "numero": "whatsapp:+5516992685376"
    },
    {
        "nome": "obama",
        "registro": "pendiente",
        "numero": "whatsapp:+5516992685376"
    }
]

KNOWN_FACES_DIR = 'known_faces'
FRAME_THICKNESS = 3
TOLERANCE = 0.4
FONT_THICKNESS = 2
MODEL = 'hog'
video = cv2.VideoCapture(0)

def color_gen(name):
    color = [(ord(c.lower()) - 97) * 8 for c in name[:3]]
    return color

def enviar_sms(match):

    for guest in guest_list:
        if guest["nome"] == match:
            numero = guest["numero"]
            message_body = "Seja bemvindo " + match

            message = client.messages \
                .create(
                body=message_body,
                from_='whatsapp:+14155238886',
                to=numero
            )
            print("enviado")

def actualizar_lista(nombre):
    for guest in guest_list:
        if guest["nome"] == match:
            guest["registro"] = "completo"

print('Cargando personas conocidas')
known_faces = []
known_names = []

for name in os.listdir(KNOWN_FACES_DIR):
    for filename in os.listdir(f'{KNOWN_FACES_DIR}/{name}'):
        image = face_recognition.load_image_file(f'{KNOWN_FACES_DIR}/{name}/{filename}')
        encoding = face_recognition.face_encodings(image)[0]
        known_faces.append(encoding)
        known_names.append(name)

print('Iniciando camara')
while True:
    ret, image = video.read()
    locations = face_recognition.face_locations(image, model=MODEL)
    encodings = face_recognition.face_encodings(image, locations)

    for face_encoding, face_location in zip(encodings, locations):
        results = face_recognition.compare_faces(known_faces, face_encoding, TOLERANCE)
        match = None
        if True in results:
            match = known_names[results.index(True)]
            top_left = (face_location[3], face_location[0])
            bottom_right = (face_location[1], face_location[2])
            color = color_gen(match)
            cv2.rectangle(image, top_left, bottom_right, color, FRAME_THICKNESS)
            top_left = (face_location[3], face_location[2])
            bottom_right = (face_location[1], face_location[2] + 22)
            cv2.rectangle(image, top_left, bottom_right, color, cv2.FILLED)
            cv2.putText(image, match, (face_location[3] + 10, face_location[2] + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                        (200, 200, 200), FONT_THICKNESS)
            for guest in guest_list:
                if guest["nome"] == match:
                    #print("Tengo un match en los invitados")
                    if guest["registro"] == "pendiente":
                        print("Mandar mensagem de registro para "+match)
                        cv2.rectangle(image, (0, 0), (640, 60), (0, 255, 0), cv2.FILLED)
                        cv2.putText(image, "Bemvindo " + match, (170, 40), cv2.FONT_ITALIC, 1, (0, 0, 255), 2)
                        cv2.imshow(filename, image)
                        enviar_sms(match)
                        actualizar_lista(match)
                        cv2.waitKey(3000)
                        cv2.rectangle(image, (0, 0), (640, 60), (0, 255, 0), cv2.FILLED)
                        cv2.putText(image, "WhatsApp enviado", (160, 40), cv2.FONT_ITALIC, 1, (0, 0, 255), 2)
                        cv2.imshow(filename, image)
                        cv2.waitKey(3000)
                    else:
                        cv2.rectangle(image, (0, 0), (640, 60), (0, 255, 0), cv2.FILLED)
                        cv2.putText(image, match + " registro completo", (170, 40), cv2.FONT_ITALIC, 1, (0, 0, 255), 2)
                        cv2.imshow(filename, image)

    cv2.imshow(filename, image)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break
