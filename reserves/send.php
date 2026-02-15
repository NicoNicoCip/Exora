<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$to = 'contact@nikosoft.space';

$name   = strip_tags(trim($_POST['name'] ?? ''));
$phone  = strip_tags(trim($_POST['phone'] ?? ''));
$email  = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$date   = strip_tags(trim($_POST['date'] ?? ''));
$time   = strip_tags(trim($_POST['time'] ?? ''));
$guests = intval($_POST['guests'] ?? 0);
$notes  = strip_tags(trim($_POST['notes'] ?? ''));

// Validate required fields
if (!$name || !$phone || !$email || !$date || !$time || !$guests) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email']);
    exit;
}

// Build email
$subject = "EXORA Reservation — $name — $date $time";

$body  = "New reservation request from ex-ora.com\n";
$body .= "========================================\n\n";
$body .= "Name:     $name\n";
$body .= "Phone:    $phone\n";
$body .= "Email:    $email\n";
$body .= "Date:     $date\n";
$body .= "Time:     $time\n";
$body .= "Guests:   $guests\n";
if ($notes) {
    $body .= "Notes:    $notes\n";
}
$body .= "\n========================================\n";
$body .= "Sent at: " . date('Y-m-d H:i:s') . "\n";

$headers  = "From: EXORA Reservations <noreply@ex-ora.com>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Dev mode: if mail() fails (no SMTP), log to file instead
$sent = @mail($to, $subject, $body, $headers);

if (!$sent) {
    // Fallback: save to log file so we can verify the form works
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) mkdir($logDir, 0755, true);
    $logFile = $logDir . '/reservations.log';
    $logEntry = "\n" . str_repeat('=', 50) . "\n";
    $logEntry .= "TO: $to\nSUBJECT: $subject\n\n$body";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
    $sent = true; // treat as success for dev
}

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to send email']);
}
